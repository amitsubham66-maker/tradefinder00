/* =========================================
   TRADEFINDER AI - DARK POOL ANALYSIS
========================================= */

import LoggingService
from "../services/loggingService.js";

import RedisService
from "../services/redisService.js";

import WebsocketCluster
from "../websocket/websocketCluster.js";

/* =========================================
   DARK POOL CONFIG
========================================= */

const DarkPoolConfig = {

    LARGE_BLOCK_THRESHOLD: 5000,

    ABNORMAL_VOLUME_RATIO: 3,

    HIDDEN_FLOW_THRESHOLD: 5
};

/* =========================================
   DARK POOL ANALYSIS ENGINE
========================================= */

class DarkPoolAnalysisEngine {

    /* =====================================
       DETECT BLOCK TRADES
    ===================================== */

    static detectBlockTrades(

        trades

    ) {

        try {

            return trades.filter(

                trade =>

                    trade.quantity >=

                    DarkPoolConfig
                    .LARGE_BLOCK_THRESHOLD
            );

        }

        catch (error) {

            LoggingService.logError(

                "BLOCK_TRADE_DETECTION",

                error
            );

            return [];
        }
    }

    /* =====================================
       HIDDEN ACCUMULATION
    ===================================== */

    static detectHiddenAccumulation(

        blockTrades

    ) {

        try {

            const buyBlocks =

                blockTrades.filter(

                    trade =>
                        trade.side === "BUY"
                );

            const sellBlocks =

                blockTrades.filter(

                    trade =>
                        trade.side === "SELL"
                );

            const buyVolume =

                buyBlocks.reduce(

                    (sum, trade) =>

                        sum + trade.quantity,

                    0
                );

            const sellVolume =

                sellBlocks.reduce(

                    (sum, trade) =>

                        sum + trade.quantity,

                    0
                );

            const accumulation =
                buyVolume > sellVolume;

            return {

                accumulation,

                buyVolume,

                sellVolume,

                institutionalBias:

                    accumulation

                    ?

                    "BULLISH"

                    :

                    "BEARISH"
            };

        }

        catch (error) {

            LoggingService.logError(

                "HIDDEN_ACCUMULATION",

                error
            );

            return {

                accumulation: false
            };
        }
    }

    /* =====================================
       OFF EXCHANGE FLOW
    ===================================== */

    static analyzeOffExchangeFlow(

        marketData

    ) {

        try {

            const ratio =

                marketData.offExchangeVolume /

                marketData.averageVolume;

            let flow = "NORMAL";

            if (

                ratio >

                DarkPoolConfig
                .ABNORMAL_VOLUME_RATIO

            ) {

                flow = "ABNORMAL";
            }

            return {

                ratio:
                    Number(
                        ratio.toFixed(2)
                    ),

                flow
            };

        }

        catch (error) {

            LoggingService.logError(

                "OFF_EXCHANGE_FLOW",

                error
            );

            return {

                flow: "UNKNOWN"
            };
        }
    }

    /* =====================================
       SMART MONEY SIGNAL
    ===================================== */

    static generateSmartMoneySignal(

        accumulation,

        offExchange

    ) {

        try {

            let signal = "NEUTRAL";

            if (

                accumulation.accumulation &&

                offExchange.flow ===
                "ABNORMAL"

            ) {

                signal =
                    "SMART_MONEY_BUYING";
            }

            if (

                !accumulation.accumulation &&

                offExchange.flow ===
                "ABNORMAL"

            ) {

                signal =
                    "SMART_MONEY_SELLING";
            }

            return {

                signal
            };

        }

        catch (error) {

            LoggingService.logError(

                "SMART_MONEY_SIGNAL",

                error
            );

            return {

                signal: "NEUTRAL"
            };
        }
    }

    /* =====================================
       FULL DARK POOL ANALYSIS
    ===================================== */

    static async analyzeDarkPool(

        trades,

        marketData

    ) {

        try {

            const blockTrades =
                this.detectBlockTrades(
                    trades
                );

            const accumulation =
                this.detectHiddenAccumulation(
                    blockTrades
                );

            const offExchange =
                this.analyzeOffExchangeFlow(
                    marketData
                );

            const smartMoney =
                this.generateSmartMoneySignal(

                    accumulation,

                    offExchange
                );

            const report = {

                timestamp:
                    new Date(),

                blockTradeCount:
                    blockTrades.length,

                accumulation,

                offExchange,

                smartMoney
            };

            /* =============================
               CACHE
            ============================= */

            await RedisService.set(

                "DARK_POOL_ANALYSIS",

                report,

                300
            );

            /* =============================
               BROADCAST
            ============================= */

            await WebsocketCluster
            .publishMarketData({

                type:
                    "DARK_POOL_ANALYSIS",

                report
            });

            return report;

        }

        catch (error) {

            LoggingService.logError(

                "DARK_POOL_ANALYSIS",

                error
            );

            return {};
        }
    }
}

/* =========================================
   EXPORT
========================================= */

export default DarkPoolAnalysisEngine;