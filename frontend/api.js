/* =========================================
   TRADEFINDER AI - API ENGINE
========================================= */

console.log(`
=========================================
API ENGINE INITIALIZED
Unified Market API System Activated
=========================================
`);

/* =========================================
   API CONFIGURATION
========================================= */

const API_CONFIG = {

    BASE_URL:
        "http://localhost:5000/api",

    TIMEOUT: 10000,

    RETRY_LIMIT: 3,

    CACHE_DURATION: 5000,

    ENABLE_CACHE: true
};

/* =========================================
   PROVIDERS
========================================= */

const PROVIDERS = {

    PRIMARY: "UPSTOX",

    SECONDARY: "ZERODHA",

    FALLBACK: "NSE"
};

/* =========================================
   API CACHE
========================================= */

const APICache = new Map();

/* =========================================
   REQUEST MANAGER
========================================= */

class RequestManager {

    static async request(
        endpoint,
        options = {}
    ) {

        const url =
            `${API_CONFIG.BASE_URL}${endpoint}`;

        const cacheKey =
            `${url}_${JSON.stringify(options)}`;

        /* =========================
           CACHE CHECK
        ========================= */

        if (
            API_CONFIG.ENABLE_CACHE &&
            APICache.has(cacheKey)
        ) {

            const cached =
                APICache.get(cacheKey);

            const isValid =
                Date.now() -
                cached.timestamp <
                API_CONFIG.CACHE_DURATION;

            if (isValid) {

                console.log(
                    `Cache Hit: ${endpoint}`
                );

                return cached.data;
            }
        }

        /* =========================
           RETRY SYSTEM
        ========================= */

        for (
            let attempt = 1;
            attempt <= API_CONFIG.RETRY_LIMIT;
            attempt++
        ) {

            try {

                const controller =
                    new AbortController();

                const timeout =
                    setTimeout(() => {

                        controller.abort();

                    }, API_CONFIG.TIMEOUT);

                const response =
                    await fetch(url, {

                        ...options,

                        signal:
                            controller.signal,

                        headers: {

                            "Content-Type":
                                "application/json",

                            Authorization:
                                `Bearer ${getToken()}`,

                            ...options.headers
                        }
                    });

                clearTimeout(timeout);

                if (!response.ok) {

                    throw new Error(
                        `HTTP ${response.status}`
                    );
                }

                const data =
                    await response.json();

                /* =========================
                   CACHE STORE
                ========================= */

                if (
                    API_CONFIG.ENABLE_CACHE
                ) {

                    APICache.set(
                        cacheKey,
                        {

                            data,

                            timestamp:
                                Date.now()
                        }
                    );
                }

                return data;

            } catch (error) {

                console.warn(
                    `Attempt ${attempt} Failed`,
                    error
                );

                if (
                    attempt ===
                    API_CONFIG.RETRY_LIMIT
                ) {

                    throw error;
                }
            }
        }
    }
}

/* =========================================
   AUTH TOKEN
========================================= */

function getToken() {

    return (
        localStorage.getItem(
            "tradefinder_token"
        ) || ""
    );
}

/* =========================================
   MARKET API
========================================= */

class MarketAPI {

    /* =========================
       LIVE MARKET DATA
    ========================= */

    static async getLiveMarket() {

        return await RequestManager.request(
            "/market/live"
        );
    }

    /* =========================
       NSE INDEX DATA
    ========================= */

    static async getIndices() {

        return await RequestManager.request(
            "/market/indices"
        );
    }

    /* =========================
       MARKET BREADTH
    ========================= */

    static async getBreadth() {

        return await RequestManager.request(
            "/market/breadth"
        );
    }

    /* =========================
       HEATMAP
    ========================= */

    static async getHeatmap() {

        return await RequestManager.request(
            "/market/heatmap"
        );
    }

    /* =========================
       WATCHLIST
    ========================= */

    static async getWatchlist() {

        return await RequestManager.request(
            "/market/watchlist"
        );
    }
}

/* =========================================
   OPTIONS API
========================================= */

class OptionsAPI {

    static async getOptionChain(symbol) {

        return await RequestManager.request(
            `/options/chain/${symbol}`
        );
    }

    static async getPCR(symbol) {

        return await RequestManager.request(
            `/options/pcr/${symbol}`
        );
    }

    static async getMaxPain(symbol) {

        return await RequestManager.request(
            `/options/maxpain/${symbol}`
        );
    }

    static async getGreeks(symbol) {

        return await RequestManager.request(
            `/options/greeks/${symbol}`
        );
    }
}

/* =========================================
   AI API
========================================= */

class AIAPI {

    static async getAISignals() {

        return await RequestManager.request(
            "/ai/signals"
        );
    }

    static async getPrediction(symbol) {

        return await RequestManager.request(
            `/ai/predict/${symbol}`
        );
    }

    static async getConfidence(symbol) {

        return await RequestManager.request(
            `/ai/confidence/${symbol}`
        );
    }

    static async getTrendStrength(symbol) {

        return await RequestManager.request(
            `/ai/trend/${symbol}`
        );
    }

    static async getMarketSentiment() {

        return await RequestManager.request(
            `/ai/sentiment`
        );
    }
}

/* =========================================
   SCANNER API
========================================= */

class ScannerAPI {

    static async getMomentumScanner() {

        return await RequestManager.request(
            "/scanner/momentum"
        );
    }

    static async getBreakoutScanner() {

        return await RequestManager.request(
            "/scanner/breakout"
        );
    }

    static async getVolumeScanner() {

        return await RequestManager.request(
            "/scanner/volume"
        );
    }

    static async getReversalScanner() {

        return await RequestManager.request(
            "/scanner/reversal"
        );
    }
}

/* =========================================
   CHART API
========================================= */

class ChartAPI {

    static async getCandles(
        symbol,
        timeframe = "5m"
    ) {

        return await RequestManager.request(
            `/chart/candles/${symbol}?tf=${timeframe}`
        );
    }

    static async getIndicators(symbol) {

        return await RequestManager.request(
            `/chart/indicators/${symbol}`
        );
    }
}

/* =========================================
   USER API
========================================= */

class UserAPI {

    static async login(credentials) {

        return await RequestManager.request(
            "/auth/login",
            {

                method: "POST",

                body: JSON.stringify(
                    credentials
                )
            }
        );
    }

    static async register(data) {

        return await RequestManager.request(
            "/auth/register",
            {

                method: "POST",

                body: JSON.stringify(data)
            }
        );
    }

    static async getProfile() {

        return await RequestManager.request(
            "/user/profile"
        );
    }
}

/* =========================================
   PROVIDER ENGINE
========================================= */

class ProviderEngine {

    static currentProvider =
        PROVIDERS.PRIMARY;

    static switchProvider(provider) {

        console.log(
            `Switching Provider → ${provider}`
        );

        this.currentProvider = provider;
    }

    static getProvider() {

        return this.currentProvider;
    }
}

/* =========================================
   NORMALIZATION ENGINE
========================================= */

class Normalizer {

    static normalizeTick(raw) {

        return {

            symbol:
                raw.symbol || "",

            price:
                raw.price || 0,

            volume:
                raw.volume || 0,

            timestamp:
                raw.timestamp || Date.now()
        };
    }

    static normalizeSignal(raw) {

        return {

            stock:
                raw.stock || "",

            signal:
                raw.signal || "HOLD",

            confidence:
                raw.confidence || 0,

            entry:
                raw.entry || 0,

            stoploss:
                raw.stoploss || 0,

            target:
                raw.target || 0
        };
    }
}

/* =========================================
   API HEALTH MONITOR
========================================= */

class APIHealth {

    static async check() {

        try {

            const start = Date.now();

            await fetch(
                `${API_CONFIG.BASE_URL}/health`
            );

            const latency =
                Date.now() - start;

            console.log(
                `API Latency: ${latency}ms`
            );

            return true;

        } catch {

            console.error(
                "API Offline"
            );

            return false;
        }
    }
}

/* =========================================
   AUTO HEALTH CHECK
========================================= */

setInterval(() => {

    APIHealth.check();

}, 30000);

/* =========================================
   EXPORTS
========================================= */

window.TradeFinderAPI = {

    MarketAPI,

    OptionsAPI,

    AIAPI,

    ScannerAPI,

    ChartAPI,

    UserAPI,

    ProviderEngine,

    Normalizer
};

console.log(
    "Unified API Engine Ready"
);