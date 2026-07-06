/* =========================================
   TRADEFINDER AI - PERFORMANCE ANALYTICS
========================================= */

import LoggingService from "../services/loggingService.js";

import RedisService from "../services/redisService.js";

import WebsocketCluster from "../websocket/websocketCluster.js";

/* =========================================
   PERFORMANCE ANALYTICS ENGINE
========================================= */

class PerformanceAnalyticsEngine {

    /* =====================================
       CALCULATE PORTFOLIO PNL
    ===================================== */

    static calculatePortfolioPnL(

        positions

    ) {

        try {

            let realizedPnL = 0;

            let unrealizedPnL = 0;

            for (const position of positions) {

                const pnl =

                    (

                        position.currentPrice -

                        position.entryPrice

                    ) *

                    position.quantity;

                if (position.closed) {

                    realizedPnL += pnl;
                }

                else {

                    unrealizedPnL += pnl;
                }
            }

            return {

                realizedPnL:
                    Number(
                        realizedPnL.toFixed(2)
                    ),

                unrealizedPnL:
                    Number(
                        unrealizedPnL.toFixed(2)
                    ),

                totalPnL:
                    Number(

                        (
                            realizedPnL +
                            unrealizedPnL
                        ).toFixed(2)
                    )
            };

        }

        catch (error) {

            LoggingService.logError(

                "PORTFOLIO_PNL",

                error
            );

            return {

                totalPnL: 0
            };
        }
    }

    /* =====================================
       STRATEGY ANALYTICS
    ===================================== */

    static analyzeStrategyPerformance(

        trades

    ) {

        try {

            const totalTrades =
                trades.length;

            const winningTrades =
                trades.filter(

                    trade => trade.pnl > 0
                );

            const losingTrades =
                trades.filter(

                    trade => trade.pnl <= 0
                );

            const grossProfit =
                winningTrades.reduce(

                    (sum, trade) =>

                        sum + trade.pnl,

                    0
                );

            const grossLoss =
                Math.abs(

                    losingTrades.reduce(

                        (sum, trade) =>

                            sum + trade.pnl,

                        0
                    )
                );

            const winRate =

                totalTrades > 0

                ?

                (

                    winningTrades.length /

                    totalTrades

                ) * 100

                :

                0;

            const profitFactor =

                grossLoss > 0

                ?

                grossProfit / grossLoss

                :

                grossProfit;

            const expectancy =

                totalTrades > 0

                ?

                (

                    grossProfit -

                    grossLoss

                ) / totalTrades

                :

                0;

            return {

                totalTrades,

                winningTrades:
                    winningTrades.length,

                losingTrades:
                    losingTrades.length,

                winRate:
                    Number(
                        winRate.toFixed(2)
                    ),

                profitFactor:
                    Number(
                        profitFactor.toFixed(2)
                    ),

                expectancy:
                    Number(
                        expectancy.toFixed(2)
                    )
            };

        }

        catch (error) {

            LoggingService.logError(

                "STRATEGY_ANALYTICS",

                error
            );

            return {};
        }
    }

    /* =====================================
       AI SIGNAL ACCURACY
    ===================================== */

    static calculateAISignalAccuracy(

        signals

    ) {

        try {

            const successfulSignals =
                signals.filter(

                    signal =>
                        signal.success === true
                );

            const accuracy =

                signals.length > 0

                ?

                (

                    successfulSignals.length /

                    signals.length

                ) * 100

                :

                0;

            return {

                totalSignals:
                    signals.length,

                successfulSignals:
                    successfulSignals.length,

                accuracy:
                    Number(
                        accuracy.toFixed(2)
                    )
            };

        }

        catch (error) {

            LoggingService.logError(

                "AI_SIGNAL_ACCURACY",

                error
            );

            return {

                accuracy: 0
            };
        }
    }

    /* =====================================
       EXECUTION ANALYTICS
    ===================================== */

    static analyzeExecutionQuality(

        executions

    ) {

        try {

            const avgSlippage =

                executions.reduce(

                    (sum, execution) =>

                        sum +

                        execution.slippage,

                    0
                ) /

                executions.length;

            const avgLatency =

                executions.reduce(

                    (sum, execution) =>

                        sum +

                        execution.latency,

                    0
                ) /

                executions.length;

            const fillRate =

                (

                    executions.filter(

                        execution =>

                            execution.status ===
                            "FILLED"
                    ).length /

                    executions.length

                ) * 100;

            return {

                avgSlippage:
                    Number(
                        avgSlippage.toFixed(2)
                    ),

                avgLatency:
                    Number(
                        avgLatency.toFixed(2)
                    ),

                fillRate:
                    Number(
                        fillRate.toFixed(2)
                    )
            };

        }

        catch (error) {

            LoggingService.logError(

                "EXECUTION_ANALYTICS",

                error
            );

            return {};
        }
    }

    /* =====================================
       SHARPE RATIO
    ===================================== */

    static calculateSharpeRatio(

        returns,

        riskFreeRate = 0

    ) {

        try {

            if (returns.length === 0) {

                return 0;
            }

            const avgReturn =

                returns.reduce(

                    (a, b) => a + b,

                    0
                ) / returns.length;

            const variance =

                returns.reduce(

                    (sum, value) =>

                        sum +

                        Math.pow(

                            value - avgReturn,

                            2
                        ),

                    0
                ) / returns.length;

            const stdDev =
                Math.sqrt(variance);

            if (stdDev === 0) {

                return 0;
            }

            const sharpe =

                (

                    avgReturn -
                    riskFreeRate

                ) / stdDev;

            return Number(
                sharpe.toFixed(2)
            );

        }

        catch (error) {

            LoggingService.logError(

                "SHARPE_RATIO",

                error
            );

            return 0;
        }
    }

    /* =====================================
       MAX DRAWDOWN
    ===================================== */

    static calculateMaxDrawdown(

        equityCurve

    ) {

        try {

            let peak = equityCurve[0];

            let maxDrawdown = 0;

            for (const value of equityCurve) {

                if (value > peak) {

                    peak = value;
                }

                const drawdown =

                    (

                        peak - value

                    ) / peak;

                if (

                    drawdown > maxDrawdown

                ) {

                    maxDrawdown = drawdown;
                }
            }

            return Number(

                (maxDrawdown * 100)
                .toFixed(2)
            );

        }

        catch (error) {

            LoggingService.logError(

                "MAX_DRAWDOWN",

                error
            );

            return 0;
        }
    }

    /* =====================================
       SAVE ANALYTICS SNAPSHOT
    ===================================== */

    static async saveAnalyticsSnapshot(

        analytics

    ) {

        try {

            await RedisService.set(

                "ANALYTICS_SNAPSHOT",

                analytics,

                300
            );

            await WebsocketCluster
            .publishAnalytics({

                type:
                    "ANALYTICS_UPDATE",

                analytics
            });

            return true;

        }

        catch (error) {

            LoggingService.logError(

                "SAVE_ANALYTICS",

                error
            );

            return false;
        }
    }
}

/* =========================================
   EXPORT
========================================= */

export default PerformanceAnalyticsEngine;