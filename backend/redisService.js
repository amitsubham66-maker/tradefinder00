/* =========================================
   TRADEFINDER AI - REDIS SERVICE
========================================= */

import Redis from "ioredis";

import LoggingService from "./loggingService.js";

/* =========================================
   REDIS CONFIG
========================================= */

const redisConfig = {

    host:
        process.env.REDIS_HOST ||
        "127.0.0.1",

    port:
        process.env.REDIS_PORT || 6379,

    password:
        process.env.REDIS_PASSWORD || "",

    retryStrategy(times) {

        return Math.min(
            times * 100,
            3000
        );
    }
};

/* =========================================
   MOCK REDIS CLASS (FALLBACK)
========================================= */

const globalPubSub = {
    listeners: [],
    subscribe(channel, client) {
        this.listeners.push({ channel, client });
    },
    publish(channel, message) {
        for (const listener of this.listeners) {
            if (listener.channel === channel && listener.client.messageCallback) {
                listener.client.messageCallback(channel, message);
            }
        }
    }
};

class MockRedis {
    constructor() {
        this.store = new Map();
        this.messageCallback = null;
    }

    async set(key, value, ...args) {
        let expiry = null;
        const exIdx = args.indexOf("EX");
        if (exIdx !== -1 && typeof args[exIdx + 1] === "number") {
            expiry = Date.now() + args[exIdx + 1] * 1000;
        }
        this.store.set(key, { value, expiry });
        return "OK";
    }

    async get(key) {
        const item = this.store.get(key);
        if (!item) return null;
        if (item.expiry && Date.now() > item.expiry) {
            this.store.delete(key);
            return null;
        }
        return item.value;
    }

    async del(key) {
        return this.store.delete(key) ? 1 : 0;
    }

    async publish(channel, message) {
        globalPubSub.publish(channel, message);
        return 1;
    }

    async subscribe(channel) {
        globalPubSub.subscribe(channel, this);
        return "OK";
    }

    on(event, callback) {
        if (event === "message") {
            this.messageCallback = callback;
        }
        return this;
    }

    async ping() {
        return "PONG";
    }

    async quit() {
        return "OK";
    }

    disconnect() {
        // No-op
    }

    async flushall() {
        this.store.clear();
        return "OK";
    }
}

/* =========================================
   REDIS CLIENTS
========================================= */

const realClient = new Redis(redisConfig);
const realPublisher = new Redis(redisConfig);
const realSubscriber = new Redis(redisConfig);

let useMockRedis = false;
const mockClient = new MockRedis();
const mockPublisher = new MockRedis();
const mockSubscriber = new MockRedis();

const handleRedisError = (error, clientName) => {
    if (!useMockRedis) {
        console.warn(`[Redis] Connection error on ${clientName}: ${error.message || error}. Falling back to in-memory mock cache.`);
        useMockRedis = true;
        try {
            realClient.disconnect();
        } catch (e) {}
        try {
            realPublisher.disconnect();
        } catch (e) {}
        try {
            realSubscriber.disconnect();
        } catch (e) {}
    }
};

realClient.on("error", (err) => handleRedisError(err, "client"));
realPublisher.on("error", (err) => handleRedisError(err, "publisher"));
realSubscriber.on("error", (err) => handleRedisError(err, "subscriber"));

const redisClient = new Proxy(realClient, {
    get(target, prop) {
        if (useMockRedis) {
            const val = mockClient[prop];
            return typeof val === "function" ? val.bind(mockClient) : val;
        }
        const val = target[prop];
        return typeof val === "function" ? val.bind(target) : val;
    }
});

const redisPublisher = new Proxy(realPublisher, {
    get(target, prop) {
        if (useMockRedis) {
            const val = mockPublisher[prop];
            return typeof val === "function" ? val.bind(mockPublisher) : val;
        }
        const val = target[prop];
        return typeof val === "function" ? val.bind(target) : val;
    }
});

const redisSubscriber = new Proxy(realSubscriber, {
    get(target, prop) {
        if (useMockRedis) {
            const val = mockSubscriber[prop];
            return typeof val === "function" ? val.bind(mockSubscriber) : val;
        }
        const val = target[prop];
        return typeof val === "function" ? val.bind(target) : val;
    }
});

/* =========================================
   REDIS EVENTS
========================================= */

redisClient.on("connect", () => {
    if (!useMockRedis) {
        console.log(`
=========================================
REDIS CONNECTED
=========================================
`);
    }
});

redisClient.on("error", error => {
    // Only log original errors if we haven't failed over
    if (!useMockRedis) {
        console.error(`
=========================================
REDIS ERROR
=========================================
`);

        LoggingService.logError(
            "REDIS_CONNECTION",
            error
        );
    }
});

/* =========================================
   REDIS SERVICE
========================================= */

class RedisService {

    /* =====================================
       SET CACHE
    ===================================== */

    static async set(

        key,

        value,

        expiry = 60

    ) {

        try {

            await redisClient.set(

                key,

                JSON.stringify(value),

                "EX",

                expiry
            );

            return true;

        }

        catch (error) {

            LoggingService.logError(

                "REDIS_SET",

                error
            );

            return false;
        }
    }

    /* =====================================
       GET CACHE
    ===================================== */

    static async get(key) {

        try {

            const data =
                await redisClient.get(key);

            if (!data) {

                return null;
            }

            return JSON.parse(data);

        }

        catch (error) {

            LoggingService.logError(

                "REDIS_GET",

                error
            );

            return null;
        }
    }

    /* =====================================
       DELETE CACHE
    ===================================== */

    static async delete(key) {

        try {

            await redisClient.del(key);

            return true;

        }

        catch (error) {

            LoggingService.logError(

                "REDIS_DELETE",

                error
            );

            return false;
        }
    }

    /* =====================================
       PUBLISH MESSAGE
    ===================================== */

    static async publish(

        channel,

        message

    ) {

        try {

            await redisPublisher.publish(

                channel,

                JSON.stringify(message)
            );

            return true;

        }

        catch (error) {

            LoggingService.logError(

                "REDIS_PUBLISH",

                error
            );

            return false;
        }
    }

    /* =====================================
       SUBSCRIBE CHANNEL
    ===================================== */

    static async subscribe(

        channel,

        callback

    ) {

        try {

            await redisSubscriber.subscribe(
                channel
            );

            redisSubscriber.on(

                "message",

                (

                    receivedChannel,

                    message

                ) => {

                    if (

                        receivedChannel ===
                        channel

                    ) {

                        callback(

                            JSON.parse(message)
                        );
                    }
                }
            );

            console.log(`
=========================================
REDIS SUBSCRIBED
=========================================
`);

            console.log(
                `CHANNEL: ${channel}`
            );

        }

        catch (error) {

            LoggingService.logError(

                "REDIS_SUBSCRIBE",

                error
            );
        }
    }

    /* =====================================
       STORE SESSION
    ===================================== */

    static async storeSession(

        sessionId,

        data,

        expiry = 86400

    ) {

        return await this.set(

            `session:${sessionId}`,

            data,

            expiry
        );
    }

    /* =====================================
       GET SESSION
    ===================================== */

    static async getSession(

        sessionId

    ) {

        return await this.get(
            `session:${sessionId}`
        );
    }

    /* =====================================
       CACHE MARKET DATA
    ===================================== */

    static async cacheMarketData(

        symbol,

        marketData

    ) {

        return await this.set(

            `market:${symbol}`,

            marketData,

            10
        );
    }

    /* =====================================
       GET MARKET DATA
    ===================================== */

    static async getMarketData(

        symbol

    ) {

        return await this.get(
            `market:${symbol}`
        );
    }

    /* =====================================
       CACHE AI SIGNAL
    ===================================== */

    static async cacheAISignal(

        symbol,

        signal

    ) {

        return await this.set(

            `ai:${symbol}`,

            signal,

            30
        );
    }

    /* =====================================
       GET AI SIGNAL
    ===================================== */

    static async getAISignal(symbol) {

        return await this.get(
            `ai:${symbol}`
        );
    }

    /* =====================================
       HEALTH CHECK
    ===================================== */

    static async healthCheck() {

        try {

            const response =
                await redisClient.ping();

            return response === "PONG";

        }

        catch (error) {

            LoggingService.logError(

                "REDIS_HEALTH_CHECK",

                error
            );

            return false;
        }
    }

    /* =====================================
       CLOSE CONNECTIONS
    ===================================== */

    static async shutdown() {

        try {

            await redisClient.quit();

            await redisPublisher.quit();

            await redisSubscriber.quit();

            console.log(`
=========================================
REDIS CONNECTIONS CLOSED
=========================================
`);

        }

        catch (error) {

            LoggingService.logError(

                "REDIS_SHUTDOWN",

                error
            );
        }
    }
}

/* =========================================
   EXPORTS
========================================= */

export {

    redisClient,

    redisPublisher,

    redisSubscriber
};

export default RedisService;