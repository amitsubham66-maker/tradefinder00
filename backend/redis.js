/* =========================================
   TRADEFINDER AI - REDIS WRAPPER
========================================= */

import RedisService, { redisPublisher, redisSubscriber, redisClient } from "./redisService.js";

const redis = redisClient;

/* =========================================
   CACHE FUNCTIONS
========================================= */

export async function setCache(key, value, expiry = 60) {
    return await RedisService.set(key, value, expiry);
}

export async function getCache(key) {
    return await RedisService.get(key);
}

export async function deleteCache(key) {
    return await RedisService.delete(key);
}

export async function cacheMarketData(symbol, data) {
    return await RedisService.cacheMarketData(symbol, data);
}

export async function cacheOptionsData(symbol, data) {
    return await RedisService.set(`options:${symbol}`, data, 60);
}

export async function cacheAISignal(symbol, signal) {
    return await RedisService.cacheAISignal(symbol, signal);
}

export async function cacheUserSession(sessionId, data) {
    return await RedisService.storeSession(sessionId, data);
}

/* =========================================
   PUB / SUB
========================================= */

export const publisher = redisPublisher;

export const subscriber = redisSubscriber;

export async function publishMessage(channel, message) {
    return await RedisService.publish(channel, message);
}

export function subscribeChannel(channel, callback) {
    return RedisService.subscribe(channel, callback);
}

/* =========================================
   HEALTH CHECK
========================================= */

export async function checkRedisHealth() {
    const isHealthy = await RedisService.healthCheck();
    return {
        status: isHealthy ? "CONNECTED" : "FALLBACK",
        connected: isHealthy,
        timestamp: new Date()
    };
}

/* =========================================
   CLEAR CACHE
========================================= */

export async function clearAllCache() {
    try {
        if (redisClient && typeof redisClient.flushall === "function") {
            await redisClient.flushall();
        }
        return true;
    } catch (error) {
        console.error("Error clearing Redis cache:", error);
        return false;
    }
}

/* =========================================
   EXPORT
========================================= */

export default redis;