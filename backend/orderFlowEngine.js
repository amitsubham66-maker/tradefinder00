/* =========================================
   TRADEFINDER AI - ORDER FLOW ENGINE
========================================= */

import LoggingService
from "../services/loggingService.js";

import RedisService
from "../services/redisService.js";

import WebsocketCluster
from "../websocket/websocketCluster.js";

/* =========================================
   ORDER FLOW ENGINE
========================================= */

class OrderFlowEngine {

    /* =====================================
       BUY / SELL PRESSURE
    ===================================== */

    static calculatePressure(

        trades

    ) {

        try {

            let buyVolume = 0;

            let sellVolume = 0;

            for (const trade of trades) {

                if (trade.side === "BUY") {

                    buyVolume += trade.quantity;
                }

                else {

                    sellVolume += trade.quantity;
                }
            }

            const totalVolume =

                buyVolume + sellVolume;

            const buyPressure =

                totalVolume > 0

                ?

                (

                    buyVolume /
                    totalVolume

                ) * 100

                :

                0;

            const sellPressure =

                totalVolume > 0

                ?

                (

                    sellVolume /
                    totalVolume

                ) * 100

                :

                0;

            let dominance = "NEUTRAL";

            if (buyPressure > 60) {

                dominance = "BUYERS";
            }

            else if (sellPressure > 60) {

                dominance = "SELLERS";
            }

            return {

                buyVolume,

                sellVolume,

                buyPressure:
                    Number(
                        buyPressure.toFixed(2)
                    ),

                sellPressure:
                    Number(
                        sellPressure.toFixed(2)
                    ),

                dominance
            };

        }

        catch (error) {

            LoggingService.logError(

                "ORDER_PRESSURE",

                error
            );

            return {

                dominance:
                    "NEUTRAL"
            };
        }
    }

    /* =====================================
       DELTA ANALYSIS
    ===================================== */

    static calculateDelta(

        trades

    ) {

        try {

            let buyDelta = 0;

            let sellDelta = 0;

            for (const trade of trades) {

                if (trade.side === "BUY") {

                    buyDelta +=
                        trade.quantity;
                }

                else {

                    sellDelta +=
                        trade.quantity;
                }
            }

            const delta =
                buyDelta - sellDelta;

            return {

                delta,

                direction:

                    delta > 0

                    ?

                    "BULLISH"

                    :

                    delta < 0

                    ?

                    "BEARISH"

                    :

                    "NEUTRAL"
            };

        }

        catch (error) {

            LoggingService.logError(

                "DELTA_ANALYSIS",

                error
            );

            return {

                delta: 0
            };
        }
    }

    /* =====================================
       CUMULATIVE DELTA
    ===================================== */

    static calculateCumulativeDelta(

        historicalDelta,

        currentDelta

    ) {

        try {

            const cumulativeDelta =

                historicalDelta +
                currentDelta;

            return {

                cumulativeDelta,

                strength:

                    cumulativeDelta > 0

                    ?

                    "ACCUMULATION"

                    :

                    cumulativeDelta < 0

                    ?

                    "DISTRIBUTION"

                    :

                    "BALANCED"
            };

        }

        catch (error) {

            LoggingService.logError(

                "CUMULATIVE_DELTA",

                error
            );

            return {

                cumulativeDelta: 0
            };
        }
    }

    /* =====================================
       VOLUME FOOTPRINT
    ===================================== */

    static analyzeFootprint(

        trades

    ) {

        try {

            const largeTrades =

                trades.filter(

                    trade =>
                        trade.quantity > 1000
                );

            const footprintStrength =

                largeTrades.length;

            return {

                largeTrades:
                    largeTrades.length,

                footprintStrength,

                institutionalActivity:

                    footprintStrength > 10
            };

        }

        catch (error) {

            LoggingService.logError(

                "FOOTPRINT_ANALYSIS",

                error
            );

            return {

                footprintStrength: 0
            };
        }
    }

    /* =====================================
       SMART MONEY FLOW
    ===================================== */

    static detectSmartMoneyFlow(

        pressure,

        delta,

        footprint

    ) {

        try {

            let smartMoney = "NEUTRAL";

            if (

                pressure.dominance ===
                "BUYERS" &&

                delta.direction ===
                "BULLISH" &&

                footprint.institutionalActivity

            ) {

                smartMoney =
                    "SMART_MONEY_BUYING";
            }

            if (

                pressure.dominance ===
                "SELLERS" &&

                delta.direction ===
                "BEARISH" &&

                footprint.institutionalActivity

            ) {

                smartMoney =
                    "SMART_MONEY_SELLING";
            }

            return {

                smartMoney
            };

        }

        catch (error) {

            LoggingService.logError(

                "SMART_MONEY_FLOW",

                error
            );

            return {

                smartMoney:
                    "NEUTRAL"
            };
        }
    }

    /* =====================================
       FULL ORDER FLOW ANALYSIS
    ===================================== */

    static async analyzeOrderFlow(

        trades,

        previousDelta = 0

    ) {

        try {

            const pressure =
                this.calculatePressure(
                    trades
                );

            const delta =
                this.calculateDelta(
                    trades
                );

            const cumulativeDelta =
                this.calculateCumulativeDelta(

                    previousDelta,

                    delta.delta
                );

            const footprint =
                this.analyzeFootprint(
                    trades
                );

            const smartMoney =
                this.detectSmartMoneyFlow(

                    pressure,

                    delta,

                    footprint
                );

            const report = {

                timestamp:
                    new Date(),

                pressure,

                delta,

                cumulativeDelta,

                footprint,

                smartMoney
            };

            /* =============================
               CACHE
            ============================= */

            await RedisService.set(

                "ORDER_FLOW_ANALYSIS",

                report,

                300
            );

            /* =============================
               BROADCAST
            ============================= */

            await WebsocketCluster
            .publishMarketData({

                type:
                    "ORDER_FLOW_ANALYSIS",

                report
            });

            return report;

        }

        catch (error) {

            LoggingService.logError(

                "ORDER_FLOW_ANALYSIS",

                error
            );

            return {};
        }
    }
}

/* =========================================
   EXPORT
========================================= */

export default OrderFlowEngine;