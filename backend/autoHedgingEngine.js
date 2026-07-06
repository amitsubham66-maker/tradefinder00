/* =========================================
   TRADEFINDER AI - AUTO HEDGING ENGINE
========================================= */

import LoggingService from "../services/loggingService.js";

import RedisService from "../services/redisService.js";

import WebsocketCluster from "../websocket/websocketCluster.js";

/* =========================================
   HEDGE CONFIG
========================================= */

const HedgeConfig = {

    MAX_HEDGE_PERCENT: 50,

    VOLATILITY_TRIGGER: 2.5,

    BEARISH_PCR: 0.7,

    PANIC_DROP_PERCENT: 3
};

/* =========================================
   AUTO HEDGING ENGINE
========================================= */

class AutoHedgingEngine {

    /* =====================================
       ANALYZE HEDGE REQUIREMENT
    ===================================== */

    static analyzeHedgeRequirement(

        portfolio,

        marketData,

        optionsData

    ) {

        try {

            let hedgeScore = 0;

            /* =============================
               VOLATILITY
            ============================= */

            if (

                marketData.volatility >

                HedgeConfig
                .VOLATILITY_TRIGGER

            ) {

                hedgeScore += 30;
            }

            /* =============================
               MARKET FALL
            ============================= */

            if (

                marketData.dayChange <

                -HedgeConfig
                .PANIC_DROP_PERCENT

            ) {

                hedgeScore += 35;
            }

            /* =============================
               OPTIONS PCR
            ============================= */

            const pcr =

                optionsData.putOI /

                optionsData.callOI;

            if (

                pcr < HedgeConfig
                .BEARISH_PCR

            ) {

                hedgeScore += 20;
            }

            /* =============================
               PORTFOLIO EXPOSURE
            ============================= */

            if (

                portfolio.exposurePercent > 70

            ) {

                hedgeScore += 25;
            }

            /* =============================
               FINAL HEDGE DECISION
            ============================= */

            let hedgeRequired =
                hedgeScore >= 40;

            let hedgePercent = Math.min(

                hedgeScore,

                HedgeConfig
                .MAX_HEDGE_PERCENT
            );

            return {

                hedgeRequired,

                hedgePercent,

                hedgeScore,

                suggestedHedge:

                    hedgeRequired

                    ?

                    "BUY_PROTECTIVE_PUT"

                    :

                    "NO_HEDGE"
            };

        }

        catch (error) {

            LoggingService.logError(

                "HEDGE_ANALYSIS",

                error
            );

            return {

                hedgeRequired: false
            };
        }
    }

    /* =====================================
       GENERATE HEDGE POSITION
    ===================================== */

    static generateHedgePosition(

        portfolio,

        hedgeAnalysis,

        optionChain

    ) {

        try {

            if (

                !hedgeAnalysis
                .hedgeRequired

            ) {

                return null;
            }

            /* =============================
               ATM PUT OPTION
            ============================= */

            const protectivePut =

                optionChain.find(

                    option =>

                        option.type === "PE" &&

                        option.atm === true
                );

            if (!protectivePut) {

                return null;
            }

            /* =============================
               HEDGE CAPITAL
            ============================= */

            const hedgeCapital =

                (

                    portfolio.totalCapital *

                    hedgeAnalysis
                    .hedgePercent

                ) / 100;

            const quantity = Math.floor(

                hedgeCapital /

                protectivePut.premium
            );

            return {

                strategy:
                    "PROTECTIVE_PUT",

                symbol:
                    protectivePut.symbol,

                strike:
                    protectivePut.strike,

                premium:
                    protectivePut.premium,

                quantity,

                hedgePercent:
                    hedgeAnalysis
                    .hedgePercent,

                expiry:
                    protectivePut.expiry
            };

        }

        catch (error) {

            LoggingService.logError(

                "GENERATE_HEDGE",

                error
            );

            return null;
        }
    }

    /* =====================================
       MONITOR HEDGE
    ===================================== */

    static monitorHedge(

        portfolioPnL,

        hedgePnL

    ) {

        try {

            const effectiveness =

                Math.abs(hedgePnL) /

                Math.abs(portfolioPnL);

            return {

                effectiveness:
                    Number(

                        (
                            effectiveness * 100
                        ).toFixed(2)
                    ),

                protected:

                    effectiveness > 0.5
            };

        }

        catch (error) {

            LoggingService.logError(

                "MONITOR_HEDGE",

                error
            );

            return {

                protected: false
            };
        }
    }

    /* =====================================
       EXECUTE AUTO HEDGE
    ===================================== */

    static async executeAutoHedge(

        portfolio,

        marketData,

        optionsData,

        optionChain

    ) {

        try {

            /* =============================
               ANALYSIS
            ============================= */

            const hedgeAnalysis =

                this.analyzeHedgeRequirement(

                    portfolio,

                    marketData,

                    optionsData
                );

            if (

                !hedgeAnalysis
                .hedgeRequired

            ) {

                return {

                    hedgeExecuted: false
                };
            }

            /* =============================
               HEDGE POSITION
            ============================= */

            const hedgePosition =

                this.generateHedgePosition(

                    portfolio,

                    hedgeAnalysis,

                    optionChain
                );

            if (!hedgePosition) {

                return {

                    hedgeExecuted: false
                };
            }

            /* =============================
               CACHE
            ============================= */

            await RedisService.set(

                "ACTIVE_HEDGE",

                hedgePosition,

                3600
            );

            /* =============================
               BROADCAST
            ============================= */

            await WebsocketCluster
            .publishRiskAlert({

                type:
                    "AUTO_HEDGE_TRIGGERED",

                hedge:
                    hedgePosition
            });

            return {

                hedgeExecuted: true,

                hedge:
                    hedgePosition
            };

        }

        catch (error) {

            LoggingService.logError(

                "AUTO_HEDGE",

                error
            );

            return {

                hedgeExecuted: false
            };
        }
    }
}

/* =========================================
   EXPORT
========================================= */

export default AutoHedgingEngine;