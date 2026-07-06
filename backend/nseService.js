/* =========================================
   TRADEFINDER AI - NSE MARKET SERVICE
   Live data from nseindia.com (new API structure, 2026)
========================================= */

import axios from "axios";
import dotenv from "dotenv";
import { cacheMarketData, cacheOptionsData, getCache, setCache } from "./redis.js";

dotenv.config();

/* =========================================
   NSE CONFIG
========================================= */

const BASE = "https://www.nseindia.com";

const NSE_CONFIG = {
    BASE_URL: BASE,

    // Page used only to obtain session cookies (homepage returns 403 to non-browsers)
    COOKIE_PAGE: `${BASE}/option-chain`,

    MARKET_STATUS: `${BASE}/api/marketStatus`,
    ALL_INDICES: `${BASE}/api/allIndices`,
    INDEX_DATA: `${BASE}/api/NextApi/apiClient?functionName=getIndexData&&type=All`,
    VARIATIONS: `${BASE}/api/live-analysis-variations?index=`,
    OC_CONTRACT_INFO: `${BASE}/api/option-chain-contract-info?symbol=`,
    OC_V3: `${BASE}/api/option-chain-v3`,

    TIMEOUT: 15000,

    // Session cookies expire quickly on NSE; refresh proactively
    COOKIE_TTL_MS: 20 * 60 * 1000,

    HEADERS: {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": `${BASE}/option-chain`,
        "Connection": "keep-alive"
    }
};

// live-analysis-variations groups stocks under these category keys
const INDEX_CATEGORY_MAP = {
    "NIFTY": "NIFTY",
    "NIFTY 50": "NIFTY",
    "BANKNIFTY": "BANKNIFTY",
    "NIFTY BANK": "BANKNIFTY",
    "NIFTYNEXT50": "NIFTYNEXT50",
    "NIFTY NEXT 50": "NIFTYNEXT50",
    "FO": "FOSec",
    "FOSEC": "FOSec",
    "ALL": "allSec",
    "ALLSEC": "allSec"
};

const OPTION_INDEX_SYMBOLS = new Set([
    "NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY", "NIFTYNXT50"
]);

/* =========================================
   NSE STATE
========================================= */

const NSEState = {
    cookies: "",
    cookiesFetchedAt: 0,
    marketStatus: "UNKNOWN",
    lastUpdated: null,
    requestCount: 0,
    usingLiveData: false
};

// Dedupe concurrent requests to the same URL
const inflight = new Map();

/* =========================================
   NSE SERVICE CLASS
========================================= */

class NSEService {

    /* =========================
       INITIALIZE
    ========================= */

    static async initialize() {
        console.log("[NSE] Initializing NSE service...");
        await this.initializeSession();
        await this.getMarketStatus();
        console.log(`[NSE] Ready. Market status: ${NSEState.marketStatus}`);
    }

    static get state() {
        return {
            marketStatus: NSEState.marketStatus,
            lastUpdated: NSEState.lastUpdated,
            requestCount: NSEState.requestCount,
            usingLiveData: NSEState.usingLiveData
        };
    }

    /* =========================
       NSE SESSION (COOKIES)
    ========================= */

    static async initializeSession() {
        try {
            const response = await axios.get(NSE_CONFIG.COOKIE_PAGE, {
                headers: {
                    ...NSE_CONFIG.HEADERS,
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
                },
                timeout: NSE_CONFIG.TIMEOUT
            });

            const cookies = response.headers["set-cookie"];
            if (cookies && cookies.length) {
                NSEState.cookies = cookies.map(c => c.split(";")[0]).join("; ");
                NSEState.cookiesFetchedAt = Date.now();
                console.log("[NSE] Session cookies acquired");
            }
        } catch (error) {
            // Some cookie pages still send cookies on error responses
            const cookies = error.response?.headers?.["set-cookie"];
            if (cookies && cookies.length) {
                NSEState.cookies = cookies.map(c => c.split(";")[0]).join("; ");
                NSEState.cookiesFetchedAt = Date.now();
                console.log("[NSE] Session cookies acquired (from error response)");
            } else {
                console.error(`[NSE] Session init failed: ${error.message}`);
            }
        }
    }

    /* =========================================
       NSE HTTP CLIENT WITH COOKIE AUTO-REFRESH
    ========================================= */

    static async requestNSE(url) {
        if (inflight.has(url)) {
            return inflight.get(url);
        }

        const promise = this._requestNSE(url).finally(() => inflight.delete(url));
        inflight.set(url, promise);
        return promise;
    }

    static async _requestNSE(url) {
        const cookiesStale =
            !NSEState.cookies ||
            Date.now() - NSEState.cookiesFetchedAt > NSE_CONFIG.COOKIE_TTL_MS;

        if (cookiesStale) {
            await this.initializeSession();
        }

        try {
            return await this._doGet(url);
        } catch (error) {
            console.warn(`[NSE] Request failed (${error.response?.status || error.message}), refreshing session and retrying: ${url}`);
            await this.initializeSession();
            const data = await this._doGet(url);
            return data;
        }
    }

    static async _doGet(url) {
        const response = await axios.get(url, {
            headers: {
                ...NSE_CONFIG.HEADERS,
                Cookie: NSEState.cookies
            },
            timeout: NSE_CONFIG.TIMEOUT
        });
        NSEState.requestCount++;
        NSEState.lastUpdated = new Date();
        NSEState.usingLiveData = true;
        return response.data;
    }

    /* =========================
       MARKET STATUS (LIVE)
    ========================= */

    static async getMarketStatus() {
        try {
            const data = await this.requestNSE(NSE_CONFIG.MARKET_STATUS);
            const capitalMarket = data?.marketState?.find(
                m => m.market === "Capital Market"
            ) || data?.marketState?.[0];

            NSEState.marketStatus = capitalMarket?.marketStatus || "UNKNOWN";

            return {
                market: NSEState.marketStatus,
                marketStates: data?.marketState || [],
                exchange: "NSE",
                live: true,
                timestamp: new Date()
            };
        } catch (error) {
            console.error(`[NSE] Market status error: ${error.message}`);
            return {
                market: NSEState.marketStatus,
                exchange: "NSE",
                live: false,
                timestamp: new Date()
            };
        }
    }

    /* =========================
       ALL INDICES (LIVE)
    ========================= */

    static async getIndices() {
        const cacheKey = "nse:indices";
        const cached = await getCache(cacheKey);
        if (cached) return cached;

        try {
            const data = await this.requestNSE(NSE_CONFIG.INDEX_DATA);
            const indices = (data?.data || []).map(ix => ({
                index: ix.indexName,
                last: ix.last,
                open: ix.open,
                high: ix.high,
                low: ix.low,
                previousClose: ix.previousClose,
                change: Number((ix.last - ix.previousClose).toFixed(2)),
                percentChange: ix.percChange,
                yearHigh: ix.yearHigh,
                yearLow: ix.yearLow,
                timeVal: ix.timeVal
            }));

            if (!indices.length) throw new Error("Empty index data");

            await setCache(cacheKey, indices, 5);
            return indices;
        } catch (error) {
            console.error(`[NSE] Index data error, trying allIndices: ${error.message}`);
            // Fallback: the broader allIndices API (works even without cookies)
            try {
                const data = await this.requestNSE(NSE_CONFIG.ALL_INDICES);
                const indices = (data?.data || []).map(ix => ({
                    index: ix.index || ix.indexName,
                    last: ix.last,
                    open: ix.open,
                    high: ix.high,
                    low: ix.low,
                    previousClose: ix.previousClose,
                    change: Number(((ix.last ?? 0) - (ix.previousClose ?? 0)).toFixed(2)),
                    percentChange: ix.percentChange ?? ix.percChange,
                    yearHigh: ix.yearHigh,
                    yearLow: ix.yearLow
                }));
                await setCache(cacheKey, indices, 5);
                return indices;
            } catch (err2) {
                console.error(`[NSE] allIndices also failed: ${err2.message}`);
                NSEState.usingLiveData = false;
                return [];
            }
        }
    }

    /* =========================
       GAINERS / LOSERS (LIVE)
       Also the source for per-index stock lists,
       since NSE retired equity-stockIndices.
    ========================= */

    static normalizeVariationStock(s) {
        const change = Number(((s.ltp ?? 0) - (s.prev_price ?? 0)).toFixed(2));
        return {
            symbol: s.symbol,
            lastPrice: s.ltp,
            change,
            pChange: s.perChange ?? s.net_price ?? 0,
            open: s.open_price,
            dayHigh: s.high_price,
            dayLow: s.low_price,
            previousClose: s.prev_price,
            totalTradedVolume: s.trade_quantity ?? 0,
            turnover: s.turnover ?? 0
        };
    }

    static async getVariations(kind) {
        // kind: "gainers" | "loosers"
        const cacheKey = `nse:variations:${kind}`;
        const cached = await getCache(cacheKey);
        if (cached) return cached;

        const data = await this.requestNSE(`${NSE_CONFIG.VARIATIONS}${kind}`);
        await setCache(cacheKey, data, 10);
        return data;
    }

    static async getGainers(index = "NIFTY") {
        const category = INDEX_CATEGORY_MAP[String(index).toUpperCase()] || "NIFTY";
        const data = await this.getVariations("gainers");
        return (data?.[category]?.data || []).map(s => this.normalizeVariationStock(s));
    }

    static async getLosers(index = "NIFTY") {
        const category = INDEX_CATEGORY_MAP[String(index).toUpperCase()] || "NIFTY";
        const data = await this.getVariations("loosers");
        return (data?.[category]?.data || []).map(s => this.normalizeVariationStock(s));
    }

    /* =========================
       FETCH LIVE STOCK DATA
    ========================= */

    static async getStockData(index = "NIFTY 50") {
        const cacheKey = `stocks:${index}`;
        try {
            const cached = await getCache(cacheKey);
            if (cached && cached.length) return cached;

            const [gainers, losers] = await Promise.all([
                this.getGainers(index),
                this.getLosers(index)
            ]);

            const seen = new Set();
            const stocks = [...gainers, ...losers]
                .filter(s => {
                    if (!s.symbol || seen.has(s.symbol)) return false;
                    seen.add(s.symbol);
                    return true;
                })
                .sort((a, b) => b.pChange - a.pChange);

            if (!stocks.length) {
                throw new Error(`No live stocks for index ${index}`);
            }

            await cacheMarketData(index, stocks);
            await setCache(cacheKey, stocks, 10);
            return stocks;
        } catch (error) {
            console.error(`[NSE] Stock data error for ${index}, serving mock fallback: ${error.message}`);
            NSEState.usingLiveData = false;
            return this.getMockStocks();
        }
    }

    static getMockStocks() {
        return [
            { symbol: "RELIANCE", lastPrice: 2984.50, change: 61.50, pChange: 2.11, totalTradedVolume: 1500000, isMock: true },
            { symbol: "HDFCBANK", lastPrice: 1688.20, change: -12.80, pChange: -0.75, totalTradedVolume: 2100000, isMock: true },
            { symbol: "TCS", lastPrice: 3820.00, change: -17.00, pChange: -0.44, totalTradedVolume: 800000, isMock: true },
            { symbol: "INFY", lastPrice: 1545.00, change: 18.90, pChange: 1.24, totalTradedVolume: 1200000, isMock: true },
            { symbol: "TATASTEEL", lastPrice: 172.10, change: 3.50, pChange: 2.08, totalTradedVolume: 3500000, isMock: true }
        ];
    }

    /* =========================
       OPTION CHAIN (LIVE, v3 API)
    ========================= */

    static async getExpiryDates(symbol = "NIFTY") {
        const cacheKey = `oc-expiry:${symbol}`;
        const cached = await getCache(cacheKey);
        if (cached) return cached;

        const data = await this.requestNSE(`${NSE_CONFIG.OC_CONTRACT_INFO}${encodeURIComponent(symbol)}`);
        const expiries = data?.expiryDates || [];
        if (expiries.length) {
            await setCache(cacheKey, expiries, 3600);
        }
        return expiries;
    }

    static async getOptionChain(symbol = "NIFTY") {
        const sym = String(symbol).toUpperCase();
        const cacheKey = `option-chain:${sym}`;
        try {
            const cached = await getCache(cacheKey);
            if (cached) return cached;

            const expiries = await this.getExpiryDates(sym);
            if (!expiries.length) throw new Error(`No expiries for ${sym}`);

            const type = OPTION_INDEX_SYMBOLS.has(sym) ? "Indices" : "Equities";
            const url = `${NSE_CONFIG.OC_V3}?type=${type}&symbol=${encodeURIComponent(sym)}&expiry=${encodeURIComponent(expiries[0])}`;
            const data = await this.requestNSE(url);

            if (!data?.records?.data?.length) {
                throw new Error(`Empty option chain for ${sym}`);
            }

            data.records.expiryDates = expiries;
            data.isLive = true;

            await cacheOptionsData(sym, data);
            await setCache(cacheKey, data, 30);
            return data;
        } catch (error) {
            console.error(`[NSE] Option chain error for ${sym}, serving mock fallback: ${error.message}`);
            NSEState.usingLiveData = false;
            return this.getMockOptionChain();
        }
    }

    static getMockOptionChain() {
        const mockData = [];
        const spotPrice = 24430;
        for (let i = -10; i <= 10; i++) {
            const strike = spotPrice - (spotPrice % 50) + (i * 50);
            const isITM_CE = strike < spotPrice;
            const isITM_PE = strike > spotPrice;
            mockData.push({
                strikePrice: strike,
                CE: {
                    openInterest: Math.floor(Math.random() * 50000) + 10000,
                    changeinOpenInterest: Math.floor(Math.random() * 10000) - 5000,
                    impliedVolatility: Number((Math.random() * 5 + 10).toFixed(2)),
                    lastPrice: Number((isITM_CE ? (spotPrice - strike) + Math.random() * 20 : Math.random() * 50).toFixed(2)),
                    change: Number((Math.random() * 20 - 10).toFixed(2)),
                    pChange: Number((Math.random() * 10 - 5).toFixed(2)),
                    totalTradedVolume: Math.floor(Math.random() * 100000)
                },
                PE: {
                    openInterest: Math.floor(Math.random() * 50000) + 10000,
                    changeinOpenInterest: Math.floor(Math.random() * 10000) - 5000,
                    impliedVolatility: Number((Math.random() * 5 + 10).toFixed(2)),
                    lastPrice: Number((isITM_PE ? (strike - spotPrice) + Math.random() * 20 : Math.random() * 50).toFixed(2)),
                    change: Number((Math.random() * 20 - 10).toFixed(2)),
                    pChange: Number((Math.random() * 10 - 5).toFixed(2)),
                    totalTradedVolume: Math.floor(Math.random() * 100000)
                }
            });
        }
        return {
            records: {
                data: mockData,
                underlyingValue: spotPrice,
                timestamp: new Date().toLocaleString()
            },
            isLive: false
        };
    }

    /* =========================
       PCR ANALYSIS
    ========================= */

    static async getPCR(symbol = "NIFTY") {
        try {
            const optionData = await this.getOptionChain(symbol);
            if (!optionData?.records?.data) return null;

            let totalCE = 0;
            let totalPE = 0;

            optionData.records.data.forEach(strike => {
                totalCE += strike.CE?.openInterest || 0;
                totalPE += strike.PE?.openInterest || 0;
            });

            const pcr = totalCE > 0 ? totalPE / totalCE : 0;

            return {
                symbol,
                totalCE,
                totalPE,
                pcr: Number(pcr.toFixed(2)),
                underlyingValue: optionData.records.underlyingValue,
                isLive: optionData.isLive !== false,
                interpretation:
                    pcr > 1 ? "BULLISH"
                    : pcr < 0.7 ? "BEARISH"
                    : "NEUTRAL"
            };
        } catch (error) {
            console.error(`[NSE] PCR error: ${error.message}`);
            return null;
        }
    }

    /* =========================
       MAX PAIN
    ========================= */

    static async getMaxPain(symbol = "NIFTY") {
        try {
            const optionData = await this.getOptionChain(symbol);
            const rows = optionData?.records?.data || [];
            if (!rows.length) return null;

            // Total option writers' loss at each strike; minimum = max pain
            let best = null;
            for (const candidate of rows) {
                const expiryPrice = candidate.strikePrice;
                let loss = 0;
                for (const row of rows) {
                    const ceOI = row.CE?.openInterest || 0;
                    const peOI = row.PE?.openInterest || 0;
                    loss += Math.max(expiryPrice - row.strikePrice, 0) * ceOI;
                    loss += Math.max(row.strikePrice - expiryPrice, 0) * peOI;
                }
                if (!best || loss < best.loss) {
                    best = { strike: expiryPrice, loss };
                }
            }

            return {
                symbol,
                maxPain: best.strike,
                underlyingValue: optionData.records.underlyingValue,
                isLive: optionData.isLive !== false
            };
        } catch (error) {
            console.error(`[NSE] Max pain error: ${error.message}`);
            return null;
        }
    }

    /* =========================
       MARKET BREADTH
    ========================= */

    static async getMarketBreadth(index = "NIFTY 50") {
        try {
            const stocks = await this.getStockData(index);

            let advances = 0;
            let declines = 0;
            let unchanged = 0;

            stocks.forEach(stock => {
                if (stock.pChange > 0) advances++;
                else if (stock.pChange < 0) declines++;
                else unchanged++;
            });

            return {
                advances,
                declines,
                unchanged,
                breadthRatio: (advances / (declines || 1)).toFixed(2)
            };
        } catch (error) {
            console.error(`[NSE] Market breadth error: ${error.message}`);
            return null;
        }
    }

    /* =========================
       SMART MONEY FLOW
    ========================= */

    static async getSmartMoneyFlow() {
        try {
            const [pcr, breadth] = await Promise.all([
                this.getPCR(),
                this.getMarketBreadth()
            ]);

            return {
                institutionalBias:
                    pcr?.pcr > 1 && Number(breadth?.breadthRatio) > 1
                        ? "BULLISH"
                        : "BEARISH",
                pcr,
                breadth,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error(`[NSE] Smart money flow error: ${error.message}`);
            return null;
        }
    }

    /* =========================
       LIVE INTRADAY ANALYSIS
    ========================= */

    static async getIntradayAnalysis(symbol = "NIFTY") {
        try {
            const [optionChain, pcr, smartMoney] = await Promise.all([
                this.getOptionChain(symbol),
                this.getPCR(symbol),
                this.getSmartMoneyFlow()
            ]);

            return {
                symbol,
                trend: pcr?.interpretation,
                smartMoney: smartMoney?.institutionalBias,
                optionChain,
                pcr,
                confidence: pcr?.pcr > 1 ? 82 : 61,
                timestamp: Date.now()
            };
        } catch (error) {
            console.error(`[NSE] Intraday analysis error: ${error.message}`);
            return null;
        }
    }
}

/* =========================================
   EXPORTS
========================================= */

export default NSEService;
