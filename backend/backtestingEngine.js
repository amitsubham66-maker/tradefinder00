/* =========================================
   TRADEFINDER AI - BACKTESTING ENGINE
========================================= */

import StrategyEngine from "../strategy/strategyEngine.js";

import RiskManager from "../risk/riskManager.js";

/* =========================================
   BACKTEST ENGINE
========================================= */

class BacktestingEngine {

    /* =====================================
       RUN BACKTEST
    ===================================== */

    static async runBacktest(

        historicalData,

        initialCapital = 100000

    ) {

        try {

            let capital =
                initialCapital;

            let peakCapital =
                initialCapital;

            let trades = [];

            let wins = 0;

            let losses = 0;

            let maxDrawdown = 0;

            /* =====================
               LOOP HISTORICAL DATA
            ===================== */

            for (

                let i = 50;

                i < historicalData.length;

                i++

            ) {

                const slice =
                    historicalData
                    .slice(0, i);

                /* =====================
                   PREPARE MARKET DATA
                ===================== */

                const marketData = {

                    close:
                        slice.map(
                            d => d.close
                        ),

                    high:
                        slice.map(
                            d => d.high
                        ),

                    low:
                        slice.map(
                            d => d.low
                        ),

                    volume:
                        slice.map(
                            d => d.volume
                        ),

                    oi:
                        slice.at(-1).oi,

                    pcr:
                        slice.at(-1).pcr
                };

                /* =====================
                   STRATEGY ANALYSIS
                ===================== */

                const strategies =

                    StrategyEngine
                    .analyzeMarket(
                        marketData
                    );

                const bestStrategy =

                    StrategyEngine
                    .selectBestStrategy(
                        strategies
                    );

                /* =====================
                   EXECUTE STRATEGY
                ===================== */

                if (

                    bestStrategy.signal &&

                    bestStrategy.signal !==
                    "NEUTRAL"

                ) {

                    const trade =
                        this.simulateTrade(

                            bestStrategy,

                            slice.at(-1),

                            capital
                        );

                    trades.push(trade);

                    capital += trade.pnl;

                    /* =====================
                       WIN / LOSS
                    ===================== */

                    if (trade.pnl > 0) {

                        wins++;
                    }

                    else {

                        losses++;
                    }

                    /* =====================
                       PEAK CAPITAL
                    ===================== */

                    if (
                        capital >
                        peakCapital
                    ) {

                        peakCapital =
                            capital;
                    }

                    /* =====================
                       DRAWDOWN
                    ===================== */

                    const drawdown =

                        (

                            peakCapital -
                            capital

                        )

                        / peakCapital;

                    if (
                        drawdown >
                        maxDrawdown
                    ) {

                        maxDrawdown =
                            drawdown;
                    }

                    /* =====================
                       RISK CHECK
                    ===================== */

                    RiskManager.checkDrawdown(

                        capital,

                        peakCapital
                    );
                }
            }

            /* =====================
               FINAL REPORT
            ===================== */

            const totalTrades =
                trades.length;

            const winRate =

                totalTrades > 0

                ?

                (

                    wins /

                    totalTrades

                ) * 100

                :

                0;

            const roi =

                (

                    (

                        capital -
                        initialCapital

                    )

                    /

                    initialCapital

                ) * 100;

            return {

                success: true,

                initialCapital,

                finalCapital:
                    Number(
                        capital.toFixed(2)
                    ),

                totalTrades,

                wins,

                losses,

                winRate:
                    Number(
                        winRate.toFixed(2)
                    ),

                roi:
                    Number(
                        roi.toFixed(2)
                    ),

                maxDrawdown:
                    Number(
                        (
                            maxDrawdown * 100
                        ).toFixed(2)
                    ),

                trades
            };

        }

        catch (error) {

            console.error(`
=========================================
BACKTEST ERROR
=========================================
`);

            console.error(error.message);

            return {

                success: false,

                error:
                    error.message
            };
        }
    }

    /* =====================================
       SIMULATE TRADE
    ===================================== */

    static simulateTrade(

        strategy,

        candle,

        capital

    ) {

        try {

            const entry =
                candle.close;

            let exit =
                candle.close;

            /* =====================
               BUY TRADE
            ===================== */

            if (

                strategy.signal
                .includes("BUY")

            ) {

                exit =

                    entry +

                    Math.random() * 30 - 10;
            }

            /* =====================
               SELL TRADE
            ===================== */

            if (

                strategy.signal
                .includes("SELL")

            ) {

                exit =

                    entry -

                    Math.random() * 30 + 10;
            }

            const pnl =
                Number(

                    (
                        exit - entry
                    ).toFixed(2)
                );

            return {

                symbol:
                    candle.symbol ||
                    "NIFTY",

                strategy:
                    strategy.strategy,

                signal:
                    strategy.signal,

                entry,

                exit,

                pnl,

                confidence:
                    strategy.confidence,

                timestamp:
                    candle.timestamp
            };

        }

        catch (error) {

            console.error(`
=========================================
SIMULATION ERROR
=========================================
`);

            return {};
        }
    }

    /* =====================================
       STRATEGY COMPARISON
    ===================================== */

    static async compareStrategies(

        historicalData

    ) {

        try {

            const results = [];

            const strategies = [

                "SCALPING",

                "BREAKOUT",

                "REVERSAL",

                "OPTIONS",

                "SMART_MONEY"
            ];

            for (

                const strategyName of strategies

            ) {

                const result =
                    await this.runBacktest(
                        historicalData
                    );

                results.push({

                    strategy:
                        strategyName,

                    winRate:
                        result.winRate,

                    roi:
                        result.roi,

                    pnl:

                        result.finalCapital -

                        result.initialCapital
                });
            }

            return results.sort(

                (a, b) =>

                    b.roi - a.roi
            );

        }

        catch (error) {

            console.error(`
=========================================
COMPARE STRATEGY ERROR
=========================================
`);

            return [];
        }
    }

    /* =====================================
       AI TRAINING DATASET
    ===================================== */

    static generateTrainingDataset(

        trades

    ) {

        try {

            return trades.map(trade => ({

                features: [

                    trade.entry,

                    trade.confidence,

                    trade.pnl
                ],

                label:
                    trade.pnl > 0
                    ? 1
                    : 0
            }));

        }

        catch (error) {

            console.error(`
=========================================
TRAINING DATASET ERROR
=========================================
`);

            return [];
        }
    }
}

/* =========================================
   EXPORT
========================================= */

export default BacktestingEngine;