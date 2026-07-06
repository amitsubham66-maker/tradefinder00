/* =========================================
   TRADEFINDER AI - ANALYTICS ENGINE
========================================= */

import Trade from "../models/tradeModel.js";

/* =========================================
   ANALYTICS ENGINE
========================================= */

class AnalyticsEngine {

    /* =====================================
       OVERALL PERFORMANCE
    ===================================== */

    static async getOverallPerformance() {

        try {

            const trades =
                await Trade.find();

            const totalTrades =
                trades.length;

            const winningTrades =
                trades.filter(

                    trade => trade.pnl > 0
                );

            const losingTrades =
                trades.filter(

                    trade => trade.pnl < 0
                );

            const totalPnL =
                trades.reduce(

                    (sum, trade) =>

                        sum + trade.pnl,

                    0
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

            return {

                totalTrades,

                winningTrades:
                    winningTrades.length,

                losingTrades:
                    losingTrades.length,

                totalPnL,

                winRate:
                    Number(
                        winRate.toFixed(2)
                    )
            };

        }

        catch (error) {

            console.error(`
=========================================
OVERALL ANALYTICS ERROR
=========================================
`);

            console.error(error.message);

            return {};
        }
    }

    /* =====================================
       STRATEGY PERFORMANCE
    ===================================== */

    static async getStrategyPerformance() {

        try {

            const trades =
                await Trade.find();

            const strategyStats = {};

            trades.forEach(trade => {

                const strategy =
                    trade.aiSignal.strategy ||
                    "UNKNOWN";

                if (
                    !strategyStats[strategy]
                ) {

                    strategyStats[strategy] = {

                        total: 0,

                        wins: 0,

                        pnl: 0
                    };
                }

                strategyStats[strategy]
                .total++;

                strategyStats[strategy]
                .pnl += trade.pnl;

                if (trade.pnl > 0) {

                    strategyStats[strategy]
                    .wins++;
                }
            });

            /* =====================
               CALCULATE WIN RATE
            ===================== */

            Object.keys(strategyStats)

            .forEach(strategy => {

                const stats =
                    strategyStats[strategy];

                stats.winRate =

                    (

                        stats.wins /

                        stats.total

                    ) * 100;
            });

            return strategyStats;

        }

        catch (error) {

            console.error(`
=========================================
STRATEGY ANALYTICS ERROR
=========================================
`);

            console.error(error.message);

            return {};
        }
    }

    /* =====================================
       DAILY PNL
    ===================================== */

    static async getDailyPnL() {

        try {

            const today =
                new Date();

            today.setHours(
                0,
                0,
                0,
                0
            );

            const trades =
                await Trade.find({

                    createdAt: {

                        $gte: today
                    }
                });

            const pnl =
                trades.reduce(

                    (sum, trade) =>

                        sum + trade.pnl,

                    0
                );

            return {

                date: today,

                pnl,

                trades:
                    trades.length
            };

        }

        catch (error) {

            console.error(`
=========================================
DAILY PNL ERROR
=========================================
`);

            console.error(error.message);

            return {};
        }
    }

    /* =====================================
       AI ACCURACY
    ===================================== */

    static async getAIAccuracy() {

        try {

            const trades =
                await Trade.find();

            let correctSignals = 0;

            trades.forEach(trade => {

                const signal =
                    trade.aiSignal.signal;

                if (

                    signal === "BULLISH" &&

                    trade.pnl > 0

                ) {

                    correctSignals++;
                }

                if (

                    signal === "BEARISH" &&

                    trade.pnl > 0

                ) {

                    correctSignals++;
                }
            });

            const accuracy =

                trades.length > 0

                ?

                (

                    correctSignals /

                    trades.length

                ) * 100

                :

                0;

            return {

                totalSignals:
                    trades.length,

                correctSignals,

                accuracy:
                    Number(
                        accuracy.toFixed(2)
                    )
            };

        }

        catch (error) {

            console.error(`
=========================================
AI ACCURACY ERROR
=========================================
`);

            console.error(error.message);

            return {};
        }
    }

    /* =====================================
       RISK ANALYTICS
    ===================================== */

    static async getRiskAnalytics() {

        try {

            const trades =
                await Trade.find();

            const maxDrawdown =
                Math.min(

                    ...trades.map(
                        trade => trade.pnl
                    )
                );

            const avgRiskReward =

                trades.reduce(

                    (sum, trade) =>

                        sum +
                        trade.riskRewardRatio,

                    0
                )

                /

                (trades.length || 1);

            return {

                maxDrawdown,

                avgRiskReward:
                    Number(
                        avgRiskReward.toFixed(2)
                    )
            };

        }

        catch (error) {

            console.error(`
=========================================
RISK ANALYTICS ERROR
=========================================
`);

            console.error(error.message);

            return {};
        }
    }

    /* =====================================
       MOST TRADED STOCKS
    ===================================== */

    static async getMostTradedStocks() {

        try {

            const trades =
                await Trade.find();

            const stockMap = {};

            trades.forEach(trade => {

                if (
                    !stockMap[trade.symbol]
                ) {

                    stockMap[trade.symbol] = 0;
                }

                stockMap[trade.symbol]++;
            });

            const sortedStocks =

                Object.entries(stockMap)

                .sort(

                    (a, b) => b[1] - a[1]
                )

                .slice(0, 10);

            return sortedStocks.map(stock => ({

                symbol: stock[0],

                trades: stock[1]
            }));

        }

        catch (error) {

            console.error(`
=========================================
MOST TRADED ERROR
=========================================
`);

            console.error(error.message);

            return [];
        }
    }

    /* =====================================
       HEATMAP ANALYTICS
    ===================================== */

    static async generateHeatmapData() {

        try {

            const trades =
                await Trade.find();

            return trades.map(trade => ({

                symbol:
                    trade.symbol,

                pnl:
                    trade.pnl,

                bullish:
                    trade.pnl > 0,

                confidence:
                    trade.aiSignal.confidence
            }));

        }

        catch (error) {

            console.error(`
=========================================
HEATMAP ANALYTICS ERROR
=========================================
`);

            console.error(error.message);

            return [];
        }
    }

    /* =====================================
       PERFORMANCE RANKING
    ===================================== */

    static async getTopStrategies() {

        try {

            const stats =
                await this
                .getStrategyPerformance();

            const ranked =

                Object.entries(stats)

                .sort(

                    (a, b) =>

                        b[1].winRate -
                        a[1].winRate
                );

            return ranked;

        }

        catch (error) {

            console.error(`
=========================================
TOP STRATEGY ERROR
=========================================
`);

            console.error(error.message);

            return [];
        }
    }

    /* =====================================
       COMPLETE DASHBOARD ANALYTICS
    ===================================== */

    static async getDashboardAnalytics() {

        try {

            const [

                overall,

                strategies,

                dailyPnL,

                aiAccuracy,

                risk,

                topStocks

            ] = await Promise.all([

                this.getOverallPerformance(),

                this.getStrategyPerformance(),

                this.getDailyPnL(),

                this.getAIAccuracy(),

                this.getRiskAnalytics(),

                this.getMostTradedStocks()
            ]);

            return {

                overall,

                strategies,

                dailyPnL,

                aiAccuracy,

                risk,

                topStocks
            };

        }

        catch (error) {

            console.error(`
=========================================
DASHBOARD ANALYTICS ERROR
=========================================
`);

            console.error(error.message);

            return {};
        }
    }
}

/* =========================================
   EXPORT
========================================= */

export default AnalyticsEngine;