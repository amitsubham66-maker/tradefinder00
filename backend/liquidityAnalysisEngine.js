/* =========================================
   TRADEFINDER AI - LIQUIDITY ANALYSIS
========================================= */

import LoggingService
from "../services/loggingService.js";

import RedisService
from "../services/redisService.js";

import WebsocketCluster
from "../websocket/websocketCluster.js";

/* =========================================
   LIQUIDITY CONFIG
========================================= */

const LiquidityConfig = {

    HIGH_LIQUIDITY_RATIO: 2,

    IMBALANCE_THRESHOLD: 1.5,

    STOP_HUNT_THRESHOLD: 3
};

/* =========================================
   LIQUIDITY ANALYSIS ENGINE
========================================= */

class LiquidityAnalysisEngine {

    /* =====================================
       DETECT LIQUIDITY ZONES
    ===================================== */

    static detectLiquidityZones(

        orderBook

    ) {

        try {

            const zones = [];

            for (const bid of orderBook.bids) {

                if (

                    bid.quantity >

                    orderBook.avgBidSize *

                    LiquidityConfig
                    .HIGH_LIQUIDITY_RATIO

                ) {

                    zones.push({

                        type: "BID_LIQUIDITY",

                        price: bid.price,

                        quantity: bid.quantity
                    });
                }
            }

            for (const ask of orderBook.asks) {

                if (

                    ask.quantity >

                    orderBook.avgAskSize *

                    LiquidityConfig
                    .HIGH_LIQUIDITY_RATIO

                ) {

                    zones.push({

                        type: "ASK_LIQUIDITY",

                        price: ask.price,

                        quantity: ask.quantity
                    });
                }
            }

            return zones;

        }

        catch (error) {

            LoggingService.logError(

                "LIQUIDITY_ZONES",

                error
            );

            return [];
        }
    }

    /* =====================================
       ORDERBOOK IMBALANCE
    ===================================== */

    static calculateOrderbookImbalance(

        orderBook

    ) {

        try {

            const totalBidVolume =

                orderBook.bids.reduce(

                    (sum, bid) =>

                        sum + bid.quantity,

                    0
                );

            const totalAskVolume =

                orderBook.asks.reduce(

                    (sum, ask) =>

                        sum + ask.quantity,

                    0
                );

            const imbalance =

                totalBidVolume /

                totalAskVolume;

            let direction = "NEUTRAL";

            if (

                imbalance >

                LiquidityConfig
                .IMBALANCE_THRESHOLD

            ) {

                direction = "BULLISH";
            }

            else if (

                imbalance <

                1 /

                LiquidityConfig
                .IMBALANCE_THRESHOLD

            ) {

                direction = "BEARISH";
            }

            return {

                imbalance:
                    Number(
                        imbalance.toFixed(2)
                    ),

                direction,

                totalBidVolume,

                totalAskVolume
            };

        }

        catch (error) {

            LoggingService.logError(

                "ORDERBOOK_IMBALANCE",

                error
            );

            return {

                direction: "NEUTRAL"
            };
        }
    }

    /* =====================================
       STOP HUNT DETECTION
    ===================================== */

    static detectStopHunt(

        marketData

    ) {

        try {

            const range =

                marketData.high -
                marketData.low;

            const candleBody =

                Math.abs(

                    marketData.close -
                    marketData.open
                );

            const wickRatio =

                range / candleBody;

            const stopHunt =

                wickRatio >

                LiquidityConfig
                .STOP_HUNT_THRESHOLD;

            return {

                stopHunt,

                wickRatio:
                    Number(
                        wickRatio.toFixed(2)
                    )
            };

        }

        catch (error) {

            LoggingService.logError(

                "STOP_HUNT",

                error
            );

            return {

                stopHunt: false
            };
        }
    }

    /* =====================================
       SMART MONEY ABSORPTION
    ===================================== */

    static detectAbsorption(

        trades,

        orderBook

    ) {

        try {

            const largeTrades =

                trades.filter(

                    trade =>
                        trade.quantity >
                        orderBook.avgTradeSize * 2
                );

            const absorptionDetected =

                largeTrades.length > 5;

            return {

                absorptionDetected,

                largeTradeCount:
                    largeTrades.length
            };

        }

        catch (error) {

            LoggingService.logError(

                "ABSORPTION_DETECTION",

                error
            );

            return {

                absorptionDetected: false
            };
        }
    }

    /* =====================================
       FULL LIQUIDITY ANALYSIS
    ===================================== */

    static async analyzeLiquidity(

        orderBook,

        marketData,

        trades

    ) {

        try {

            const liquidityZones =

                this.detectLiquidityZones(
                    orderBook
                );

            const imbalance =

                this.calculateOrderbookImbalance(
                    orderBook
                );

            const stopHunt =

                this.detectStopHunt(
                    marketData
                );

            const absorption =

                this.detectAbsorption(

                    trades,

                    orderBook
                );

            const report = {

                timestamp:
                    new Date(),

                liquidityZones,

                imbalance,

                stopHunt,

                absorption
            };

            /* =============================
               CACHE
            ============================= */

            await RedisService.set(

                "LIQUIDITY_ANALYSIS",

                report,

                300
            );

            /* =============================
               BROADCAST
            ============================= */

            await WebsocketCluster
            .publishMarketData({

                type:
                    "LIQUIDITY_ANALYSIS",

                report
            });

            return report;

        }

        catch (error) {

            LoggingService.logError(

                "LIQUIDITY_ANALYSIS",

                error
            );

            return {};
        }
    }
}

/* =========================================
   EXPORT
========================================= */

export default LiquidityAnalysisEngine;