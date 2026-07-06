/* =========================================
   TRADEFINDER AI - REDIS DISABLED
========================================= */

/* =========================================
   DUMMY REDIS OBJECT
========================================= */

const redis = null;

/* =========================================
   CACHE FUNCTIONS
========================================= */

export async function setCache() {
    return true;
}

export async function getCache() {
    return null;
}

export async function deleteCache() {
    return true;
}

export async function cacheMarketData() {
    return true;
}

export async function cacheOptionsData() {
    return true;
}

export async function cacheAISignal() {
    return true;
}

export async function cacheUserSession() {
    return true;
}

/* =========================================
   PUB / SUB DISABLED
========================================= */

export const publisher = null;

export const subscriber = null;

export async function publishMessage() {
    return true;
}

export function subscribeChannel() {
    return true;
}

/* =========================================
   HEALTH CHECK
========================================= */

export async function checkRedisHealth() {

    return {

        status: "DISABLED",

        connected: false,

        timestamp: new Date()
    };
}

/* =========================================
   CLEAR CACHE
========================================= */

export async function clearAllCache() {

    console.log("Redis Disabled");

    return true;
}

/* =========================================
   EXPORT
========================================= */

export default redis;