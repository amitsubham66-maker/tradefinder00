/* =========================================
   TRADEFINDER AI - RISK MANAGEMENT ENGINE
========================================= */

import LoggingService from "../services/loggingService.js";

import RedisService from "../services/redisService.js";

import WebsocketCluster from "../websocket/websocketCluster.js";

/* =========================================
   RISK CONFIG
========================================= */

const RiskConfig = {

    MAX_RISK_PER_TRADE: 2,

    MAX_DAILY_LOSS: 5,

    MAX_DRAWDOWN: 15,

    MIN_RISK_REWARD: 1.5,

    MAX_OPEN_POSITIONS: 10,

    MIN_AI_CONFIDENCE: 70
};

/* =========================================
   RISK ENGINE
========================================= */

class RiskManagementEngine {

    /* =====================================
       POSITION SIZE CALCULATION
    ===================================== */

    static calculatePositionSize(

        capital,

        entry,

        stoploss,

        riskPercent =
            RiskConfig.MAX_RISK_PER_TRADE

    ) {

        try {

            const riskAmount =

                (

                    capital *

                    riskPercent

                ) / 100;

            const stopDistance =

                Math.abs(

                    entry - stoploss
                );

            const quantity =

                Math.floor(

                    riskAmount /
                    stopDistance
                );

            return {

                quantity,

                riskAmount,

                stopDistance
            };

        }

        catch (error) {

            LoggingService.logError(

                "POSITION_SIZE",

                error
            );

            return {

                quantity: 0
            };
        }
    }

    /* =====================================
       RISK REWARD VALIDATION
    ===================================== */

    static validateRiskReward(

        entry,

        target,

        stoploss

    ) {

        try {

            const reward =

                Math.abs(
                    target - entry
                );

            const risk =

                Math.abs(
                    entry - stoploss
                );

            const rr = reward / risk;

            return {

                valid:

                    rr >=
                    RiskConfig
                    .MIN_RISK_REWARD,

                rr:
                    Number(
                        rr.toFixed(2)
                    )
            };

        }

        catch (error) {

            LoggingService.logError(

                "RISK_REWARD",

                error
            );

            return {

                valid: false
            };
        }
    }

    /* =====================================
       DAILY LOSS CHECK
    ===================================== */

    static async checkDailyLoss(

        userId,

        currentPnL,

        capital

    ) {

        try {

            const lossPercent =

                (

                    Math.abs(currentPnL) /

                    capital

                ) * 100;

            const exceeded =

                currentPnL < 0 &&

                lossPercent >=
                RiskConfig
                .MAX_DAILY_LOSS;

            if (exceeded) {

                await WebsocketCluster
                .publishRiskAlert({

                    type:
                        "DAILY_LOSS_LIMIT",

                    userId,

                    lossPercent
                });

                await RedisService.set(

                    `risk:block:${userId}`,

                    true,

                    86400
                );
            }

            return {

                exceeded,

                lossPercent:
                    Number(
                        lossPercent.toFixed(2)
                    )
            };

        }

        catch (error) {

            LoggingService.logError(

                "DAILY_LOSS_CHECK",

                error
            );

            return {

                exceeded: false
            };
        }
    }

    /* =====================================
       AI CONFIDENCE FILTER
    ===================================== */

    static validateAISignal(signal) {

        try {

            return {

                valid:

                    signal.confidence >=
                    RiskConfig
                    .MIN_AI_CONFIDENCE,

                confidence:
                    signal.confidence
            };

        }

        catch (error) {

            LoggingService.logError(

                "AI_CONFIDENCE_FILTER",

                error
            );

            return {

                valid: false
            };
        }
    }

    /* =====================================
       PORTFOLIO EXPOSURE
    ===================================== */

    static calculateExposure(

        positions,

        capital

    ) {

        try {

            const exposure =

                positions.reduce(

                    (sum, position) =>

                        sum +

                        (

                            position.quantity *

                            position.ltp
                        ),

                    0
                );

            const exposurePercent =

                (

                    exposure /

                    capital

                ) * 100;

            return {

                exposure,

                exposurePercent:
                    Number(
                        exposurePercent.toFixed(2)
                    )
            };

        }

        catch (error) {

            LoggingService.logError(

                "PORTFOLIO_EXPOSURE",

                error
            );

            return {

                exposure: 0
            };
        }
    }

    /* =====================================
       CORRELATION RISK
    ===================================== */

    static detectCorrelationRisk(

        positions

    ) {

        try {

            const sectors = {};

            for (

                const position of positions

            ) {

                const sector =
                    position.sector ||
                    "UNKNOWN";

                sectors[sector] =

                    (sectors[sector] || 0) + 1;
            }

            const riskySectors =

                Object.entries(sectors)

                .filter(

                    ([, count]) =>
                        count >= 3
                )

                .map(

                    ([sector]) => sector
                );

            return {

                highCorrelation:
                    riskySectors.length > 0,

                riskySectors
            };

        }

        catch (error) {

            LoggingService.logError(

                "CORRELATION_RISK",

                error
            );

            return {

                highCorrelation: false
            };
        }
    }

    /* =====================================
       EMERGENCY SHUTDOWN
    ===================================== */

    static async emergencyShutdown(

        reason

    ) {

        try {

            console.log(`
=========================================
EMERGENCY RISK SHUTDOWN
=========================================
`);

            await RedisService.set(

                "AUTO_TRADING_DISABLED",

                true,

                86400
            );

            await WebsocketCluster
            .publishRiskAlert({

                type:
                    "EMERGENCY_SHUTDOWN",

                reason
            });

            return true;

        }

        catch (error) {

            LoggingService.logError(

                "EMERGENCY_SHUTDOWN",

                error
            );

            return false;
        }
    }

    /* =====================================
       COMPLETE RISK EVALUATION
    ===================================== */

    static async evaluateTradeRisk(

        signal,

        portfolio,

        capital

    ) {

        try {

            /* =============================
               AI CONFIDENCE
            ============================= */

            const aiValidation =
                this.validateAISignal(
                    signal
                );

            /* =============================
               RR VALIDATION
            ============================= */

            const rrValidation =
                this.validateRiskReward(

                    signal.entry,

                    signal.target,

                    signal.stoploss
                );

            /* =============================
               POSITION SIZE
            ============================= */

            const positionSizing =
                this.calculatePositionSize(

                    capital,

                    signal.entry,

                    signal.stoploss
                );

            /* =============================
               EXPOSURE
            ============================= */

            const exposure =
                this.calculateExposure(

                    portfolio.positions,

                    capital
                );

            /* =============================
               CORRELATION
            ============================= */

            const correlation =
                this.detectCorrelationRisk(

                    portfolio.positions
                );

            /* =============================
               FINAL APPROVAL
            ============================= */

            const approved =

                aiValidation.valid &&

                rrValidation.valid &&

                !correlation.highCorrelation &&

                exposure.exposurePercent < 80;

            return {

                approved,

                aiValidation,

                rrValidation,

                positionSizing,

                exposure,

                correlation
            };

        }

        catch (error) {

            LoggingService.logError(

                "COMPLETE_RISK_EVALUATION",

                error
            );

            return {

                approved: false
            };
        }
    }
}

/* =========================================
   EXPORT
========================================= */

export default RiskManagementEngine;