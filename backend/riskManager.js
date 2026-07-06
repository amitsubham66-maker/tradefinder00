/* =========================================
   TRADEFINDER AI - RISK MANAGER
========================================= */

import dotenv from "dotenv";

dotenv.config();

/* =========================================
   RISK CONFIG
========================================= */

const RiskConfig = {

    MAX_RISK_PER_TRADE: 0.01,

    MAX_DAILY_LOSS: 5000,

    MAX_OPEN_TRADES: 5,

    MAX_DRAWDOWN: 0.1,

    MIN_AI_CONFIDENCE: 70,

    MAX_VOLATILITY: 5,

    TRAILING_SL_PERCENT: 0.5
};

/* =========================================
   RISK STATE
========================================= */

const RiskState = {

    dailyLoss: 0,

    openTrades: [],

    rejectedTrades: [],

    totalExposure: 0,

    emergencyStop: false
};

/* =========================================
   MAIN RISK MANAGER
========================================= */

class RiskManager {

    /* =========================
       VALIDATE TRADE
    ========================= */

    static validateTrade(

        signal,

        accountBalance = 100000

    ) {

        try {

            /* =====================
               EMERGENCY STOP
            ===================== */

            if (
                RiskState.emergencyStop
            ) {

                return {

                    allowed: false,

                    reason:
                        "Emergency Stop Active"
                };
            }

            /* =====================
               AI CONFIDENCE
            ===================== */

            if (

                signal.confidence <

                RiskConfig
                .MIN_AI_CONFIDENCE

            ) {

                return {

                    allowed: false,

                    reason:
                        "Low AI Confidence"
                };
            }

            /* =====================
               DAILY LOSS CHECK
            ===================== */

            if (

                RiskState.dailyLoss >=

                RiskConfig
                .MAX_DAILY_LOSS

            ) {

                return {

                    allowed: false,

                    reason:
                        "Daily Loss Limit Reached"
                };
            }

            /* =====================
               OPEN TRADES LIMIT
            ===================== */

            if (

                RiskState.openTrades.length >=

                RiskConfig
                .MAX_OPEN_TRADES

            ) {

                return {

                    allowed: false,

                    reason:
                        "Max Open Trades Reached"
                };
            }

            /* =====================
               VOLATILITY CHECK
            ===================== */

            if (

                signal.volatility &&

                signal.volatility >

                RiskConfig.MAX_VOLATILITY

            ) {

                return {

                    allowed: false,

                    reason:
                        "High Market Volatility"
                };
            }

            /* =====================
               POSITION SIZE
            ===================== */

            const quantity =
                this.calculatePositionSize(

                    signal,

                    accountBalance
                );

            return {

                allowed: true,

                quantity,

                risk:

                    quantity *
                    signal.entry
            };

        }

        catch (error) {

            console.error(`
=========================================
RISK VALIDATION ERROR
=========================================
`);

            console.error(error.message);

            return {

                allowed: false,

                reason:
                    "Risk Engine Failure"
            };
        }
    }

    /* =====================================
       POSITION SIZE CALCULATION
    ===================================== */

    static calculatePositionSize(

        signal,

        capital

    ) {

        const riskAmount =

            capital *

            RiskConfig
            .MAX_RISK_PER_TRADE;

        const stopDistance =

            Math.abs(

                signal.entry -

                signal.stoploss
            );

        const quantity =

            Math.floor(

                riskAmount /

                stopDistance
            );

        return quantity > 0
            ? quantity
            : 1;
    }

    /* =====================================
       REGISTER TRADE
    ===================================== */

    static registerTrade(trade) {

        RiskState.openTrades.push(trade);

        RiskState.totalExposure +=

            trade.quantity *

            trade.entryPrice;

        console.log(`
=========================================
TRADE REGISTERED
=========================================
`);

        console.log({

            symbol:
                trade.symbol,

            exposure:
                RiskState.totalExposure
        });
    }

    /* =====================================
       CLOSE TRADE
    ===================================== */

    static closeTrade(trade) {

        RiskState.openTrades =

            RiskState.openTrades.filter(

                t =>

                    t.orderId !==
                    trade.orderId
            );

        RiskState.dailyLoss +=

            trade.pnl < 0
            ? Math.abs(trade.pnl)
            : 0;

        console.log(`
=========================================
TRADE CLOSED
=========================================
`);

        console.log({

            pnl:
                trade.pnl,

            dailyLoss:
                RiskState.dailyLoss
        });
    }

    /* =====================================
       TRAILING STOPLOSS
    ===================================== */

    static updateTrailingSL(

        trade,

        currentPrice

    ) {

        try {

            if (

                trade.side === "BUY"

            ) {

                const newSL =

                    currentPrice *

                    (

                        1 -

                        RiskConfig
                        .TRAILING_SL_PERCENT
                        / 100
                    );

                if (

                    newSL >

                    trade.stoploss

                ) {

                    trade.stoploss =
                        newSL;
                }
            }

            return trade.stoploss;

        }

        catch (error) {

            console.error(`
=========================================
TRAILING SL ERROR
=========================================
`);

            console.error(error.message);

            return trade.stoploss;
        }
    }

    /* =====================================
       DRAWDOWN CHECK
    ===================================== */

    static checkDrawdown(

        accountBalance,

        peakBalance

    ) {

        const drawdown =

            (

                peakBalance -
                accountBalance

            )

            / peakBalance;

        if (

            drawdown >

            RiskConfig.MAX_DRAWDOWN

        ) {

            RiskState.emergencyStop =
                true;

            return {

                emergency: true,

                drawdown
            };
        }

        return {

            emergency: false,

            drawdown
        };
    }

    /* =====================================
       CIRCUIT BREAKER
    ===================================== */

    static activateEmergencyStop() {

        RiskState.emergencyStop =
            true;

        console.log(`
=========================================
EMERGENCY STOP ACTIVATED
=========================================
`);
    }

    /* =====================================
       RESET DAILY LIMITS
    ===================================== */

    static resetDailyRisk() {

        RiskState.dailyLoss = 0;

        RiskState.rejectedTrades = [];

        console.log(`
=========================================
DAILY RISK RESET
=========================================
`);
    }

    /* =====================================
       RISK ANALYTICS
    ===================================== */

    static getRiskAnalytics() {

        return {

            dailyLoss:
                RiskState.dailyLoss,

            openTrades:
                RiskState.openTrades.length,

            totalExposure:
                RiskState.totalExposure,

            emergencyStop:
                RiskState.emergencyStop,

            rejectedTrades:
                RiskState.rejectedTrades.length
        };
    }
}

/* =========================================
   EXPORTS
========================================= */

export default RiskManager;