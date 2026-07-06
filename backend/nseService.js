/* =========================================
   TRADEFINDER AI - NSE MARKET SERVICE
========================================= */

import axios from "axios";

import dotenv from "dotenv";

import {

    cacheMarketData,

    cacheOptionsData,

    getCache

} from "./redis.js";

dotenv.config();

/* =========================================
   NSE CONFIG
========================================= */

const NSE_CONFIG = {

    BASE_URL:
        "https://www.nseindia.com",

    OPTION_CHAIN:
        "https://www.nseindia.com/api/option-chain-indices",

    EQUITY_STOCKS:
        "https://www.nseindia.com/api/equity-stockIndices",

    MARKET_STATUS:
        "https://www.nseindia.com/api/marketStatus",

    ALL_INDICES:
        "https://www.nseindia.com/api/allIndices",

    HEADERS: {

        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",

        "Accept":
            "application/json",

        "Accept-Language":
            "en-US,en;q=0.9",

        "Referer":
            "https://www.nseindia.com/",

        "Connection":
            "keep-alive"
    }
};

/* =========================================
   NSE STATE
========================================= */

const NSEState = {

    cookies: "",

    marketStatus: "CLOSED",

    lastUpdated: null,

    requestCount: 0
};

/* =========================================
   NSE SERVICE CLASS
========================================= */

class NSEService {


    /* =========================
       INITIALIZE
    ========================= */

    static async initialize() {

        console.log(`
=========================================
INITIALIZING NSE SERVICE
=========================================
`);

        await this.initializeSession();

        await this.getMarketStatus();
    }

    /* =========================
       NSE SESSION INIT
    ========================= */

    static async initializeSession() {

        try {

            const response =
                await axios.get(

                    NSE_CONFIG.BASE_URL,

                    {

                        headers:
                            NSE_CONFIG.HEADERS
                    }
                );

            const cookies =
                response.headers[
                    "set-cookie"
                ];

            if (cookies) {

                NSEState.cookies =
                    cookies.join("; ");
            }

            console.log(`
=========================================
NSE SESSION INITIALIZED
=========================================
`);

        }

        catch (error) {

            console.error(`
=========================================
NSE SESSION ERROR
=========================================
`);

            console.error(error.message);
        }
    }

    /* =========================
       GET MARKET STATUS
    ========================= */

    static async getMarketStatus() {

        try {

            const response =
                await axios.get(

                    NSE_CONFIG.MARKET_STATUS,

                    {

                        headers: {

                            ...NSE_CONFIG.HEADERS,

                            Cookie:
                                NSEState.cookies
                        }
                    }
                );

            NSEState.marketStatus =
                response.data
                ?.marketState?.[0]
                ?.marketStatus || "UNKNOWN";

            return response.data;

        }

        catch (error) {

            console.error(`
=========================================
MARKET STATUS ERROR
=========================================
`);

            console.error(error.message);

            return null;
        }
    }

    /* =========================
       FETCH LIVE STOCK DATA
    ========================= */

    static async getStockData(index = "NIFTY 50") {

        try {

            const cacheKey =
                `stocks:${index}`;

            const cached =
                await getCache(cacheKey);

            if (cached) {

                return cached;
            }

            const response =
                await axios.get(

                    `${NSE_CONFIG.EQUITY_STOCKS}?index=${encodeURIComponent(index)}`,

                    {

                        headers: {

                            ...NSE_CONFIG.HEADERS,

                            Cookie:
                                NSEState.cookies
                        }
                    }
                );

            const stocks =
                response.data?.data || [];

            await cacheMarketData(

                index,

                stocks
            );

            NSEState.requestCount++;

            return stocks;

        }

        catch (error) {

            console.error(`
=========================================
STOCK DATA ERROR
=========================================
`);

            console.error(error.message);

            return [];
        }
    }

    /* =========================
       OPTION CHAIN
    ========================= */

    static async getOptionChain(

        symbol = "NIFTY"

    ) {

        try {

            const cacheKey =
                `option-chain:${symbol}`;

            const cached =
                await getCache(cacheKey);

            if (cached) {

                return cached;
            }

            const response =
                await axios.get(

                    `${NSE_CONFIG.OPTION_CHAIN}?symbol=${symbol}`,

                    {

                        headers: {

                            ...NSE_CONFIG.HEADERS,

                            Cookie:
                                NSEState.cookies
                        }
                    }
                );

            const options =
                response.data;

            await cacheOptionsData(

                symbol,

                options
            );

            NSEState.requestCount++;

            return options;

        }

        catch (error) {

            console.error(`
=========================================
OPTION CHAIN ERROR
=========================================
`);

            console.error(error.message);

            return null;
        }
    }

    /* =========================
       PCR ANALYSIS
    ========================= */

    static async getPCR(symbol = "NIFTY") {

        try {

            const optionData =
                await this.getOptionChain(symbol);

            if (!optionData) {

                return null;
            }

            let totalCE = 0;

            let totalPE = 0;

            optionData.records.data.forEach(

                strike => {

                    totalCE +=
                        strike.CE?.openInterest || 0;

                    totalPE +=
                        strike.PE?.openInterest || 0;
                }
            );

            const pcr =
                totalPE / totalCE;

            return {

                symbol,

                totalCE,

                totalPE,

                pcr:
                    Number(
                        pcr.toFixed(2)
                    ),

                interpretation:

                    pcr > 1
                    ? "BULLISH"

                    : pcr < 0.7
                    ? "BEARISH"

                    : "NEUTRAL"
            };

        }

        catch (error) {

            console.error(`
=========================================
PCR ERROR
=========================================
`);

            console.error(error.message);

            return null;
        }
    }

    /* =========================
       MARKET BREADTH
    ========================= */

    static async getMarketBreadth() {

        try {

            const stocks =
                await this.getStockData();

            let advances = 0;

            let declines = 0;

            let unchanged = 0;

            stocks.forEach(stock => {

                if (
                    stock.pChange > 0
                ) {

                    advances++;

                } else if (
                    stock.pChange < 0
                ) {

                    declines++;

                } else {

                    unchanged++;
                }
            });

            return {

                advances,

                declines,

                unchanged,

                breadthRatio:
                    (
                        advances /
                        (declines || 1)
                    ).toFixed(2)
            };

        }

        catch (error) {

            console.error(`
=========================================
MARKET BREADTH ERROR
=========================================
`);

            console.error(error.message);

            return null;
        }
    }

    /* =========================
       SMART MONEY FLOW
    ========================= */

    static async getSmartMoneyFlow() {

        try {

            const pcr =
                await this.getPCR();

            const breadth =
                await this.getMarketBreadth();

            return {

                institutionalBias:

                    pcr?.pcr > 1 &&
                    breadth?.breadthRatio > 1

                    ? "BULLISH"

                    : "BEARISH",

                pcr,

                breadth,

                timestamp:
                    Date.now()
            };

        }

        catch (error) {

            console.error(`
=========================================
SMART MONEY FLOW ERROR
=========================================
`);

            console.error(error.message);

            return null;
        }
    }

    /* =========================
       LIVE INTRADAY ANALYSIS
    ========================= */

    static async getIntradayAnalysis(

        symbol = "NIFTY"

    ) {

        try {

            const optionChain =
                await this.getOptionChain(symbol);

            const pcr =
                await this.getPCR(symbol);

            const smartMoney =
                await this.getSmartMoneyFlow();

            return {

                symbol,

                trend:
                    pcr?.interpretation,

                smartMoney:
                    smartMoney
                    ?.institutionalBias,

                optionChain,

                pcr,

                confidence:

                    pcr?.pcr > 1
                    ? 82
                    : 61,

                timestamp:
                    Date.now()
            };

        }

        catch (error) {

            console.error(`
=========================================
INTRADAY ANALYSIS ERROR
=========================================
`);

            console.error(error.message);

            return null;
        }
    }

    /* =========================
       LIVE MARKET STREAM
    ========================= */

    static async streamMarketData() {

        setInterval(async () => {

            try {

                const nifty =
                    await this.getIntradayAnalysis(
                        "NIFTY"
                    );

                const banknifty =
                    await this.getIntradayAnalysis(
                        "BANKNIFTY"
                    );

                console.log(`
=========================================
LIVE MARKET STREAM ACTIVE
=========================================
`);

                console.log({

                    niftyTrend:
                        nifty?.trend,

                    bankniftyTrend:
                        banknifty?.trend
                });

            }

            catch (error) {

                console.error(`
=========================================
MARKET STREAM ERROR
=========================================
`);

                console.error(error.message);
            }

        }, 5000);
    }
    static async getMarketStatus() {

    return {
        market: "OPEN",
        timestamp: new Date(),
        exchange: "NSE"
    };

}
}

/* =========================================
   AUTO INITIALIZE
========================================= */

(async () => {

    await NSEService.initialize();

})();

/* =========================================
   EXPORTS
========================================= */

export default NSEService;
console.log("NSEService loaded");
console.log(typeof NSEService);
console.log(Object.getOwnPropertyNames(NSEService));