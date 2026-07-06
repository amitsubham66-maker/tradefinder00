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
   REDIS CLIENTS
========================================= */

const redisClient =
    new Redis(redisConfig);

const redisPublisher =
    new Redis(redisConfig);

const redisSubscriber =
    new Redis(redisConfig);

/* =========================================
   REDIS EVENTS
========================================= */

redisClient.on("connect", () => {

    console.log(`
=========================================
REDIS CONNECTED
=========================================
`);
});

redisClient.on("error", error => {

    console.error(`
=========================================
REDIS ERROR
=========================================
`);

    LoggingService.logError(
        "REDIS_CONNECTION",
        error
    );
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