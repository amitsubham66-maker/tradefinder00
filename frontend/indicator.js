/* =========================================
   TRADEFINDER AI - INDICATORS ENGINE
========================================= */

console.log(`
=========================================
INDICATORS ENGINE INITIALIZED
Institutional Calculations Activated
=========================================
`);

/* =========================================
   INDICATOR CONFIG
========================================= */

const IndicatorConfig = {

    RSI_PERIOD: 14,

    EMA_FAST: 9,

    EMA_SLOW: 21,

    MACD_FAST: 12,

    MACD_SLOW: 26,

    MACD_SIGNAL: 9,

    ATR_PERIOD: 14,

    BB_PERIOD: 20,

    BB_STD_DEV: 2,

    VWAP_ENABLED: true,

    SUPER_TREND_PERIOD: 10,

    SUPER_TREND_MULTIPLIER: 3
};

/* =========================================
   MAIN INDICATOR ENGINE
========================================= */

class IndicatorEngine {

    static calculateAll(candles = []) {

        if (!candles.length) {

            console.warn(
                "No candle data received"
            );

            return {};
        }

        return {

            rsi:
                RSI.calculate(candles),

            emaFast:
                EMA.calculate(
                    candles,
                    IndicatorConfig.EMA_FAST
                ),

            emaSlow:
                EMA.calculate(
                    candles,
                    IndicatorConfig.EMA_SLOW
                ),

            sma20:
                SMA.calculate(candles, 20),

            macd:
                MACD.calculate(candles),

            atr:
                ATR.calculate(candles),

            bollinger:
                BollingerBands.calculate(
                    candles
                ),

            vwap:
                VWAP.calculate(candles),

            supertrend:
                SuperTrend.calculate(
                    candles
                ),

            momentum:
                Momentum.calculate(candles),

            volatility:
                Volatility.calculate(candles),

            trend:
                TrendStrength.calculate(
                    candles
                ),

            volume:
                VolumeAnalysis.calculate(
                    candles
                )
        };
    }
}

/* =========================================
   RSI
========================================= */

class RSI {

    static calculate(candles) {

        const period =
            IndicatorConfig.RSI_PERIOD;

        if (candles.length < period) {

            return 50;
        }

        let gains = 0;

        let losses = 0;

        for (
            let i = 1;
            i <= period;
            i++
        ) {

            const diff =
                candles[i].close -
                candles[i - 1].close;

            if (diff >= 0) {

                gains += diff;

            } else {

                losses += Math.abs(diff);
            }
        }

        const avgGain =
            gains / period;

        const avgLoss =
            losses / period;

        if (avgLoss === 0) {

            return 100;
        }

        const rs =
            avgGain / avgLoss;

        const rsi =
            100 - (100 / (1 + rs));

        return Number(
            rsi.toFixed(2)
        );
    }
}

/* =========================================
   EMA
========================================= */

class EMA {

    static calculate(candles, period) {

        if (
            candles.length < period
        ) {

            return 0;
        }

        const multiplier =
            2 / (period + 1);

        let ema =
            candles[0].close;

        candles.forEach(candle => {

            ema =
                (
                    candle.close - ema
                ) *
                multiplier +
                ema;
        });

        return Number(
            ema.toFixed(2)
        );
    }
}

/* =========================================
   SMA
========================================= */

class SMA {

    static calculate(candles, period) {

        if (
            candles.length < period
        ) {

            return 0;
        }

        const sliced =
            candles.slice(-period);

        const sum =
            sliced.reduce(
                (acc, c) =>
                    acc + c.close,
                0
            );

        return Number(
            (
                sum / period
            ).toFixed(2)
        );
    }
}

/* =========================================
   MACD
========================================= */

class MACD {

    static calculate(candles) {

        const fastEMA =
            EMA.calculate(
                candles,
                IndicatorConfig.MACD_FAST
            );

        const slowEMA =
            EMA.calculate(
                candles,
                IndicatorConfig.MACD_SLOW
            );

        const macd =
            fastEMA - slowEMA;

        return {

            macd:
                Number(macd.toFixed(2)),

            signal:
                macd > 0
                ? "BULLISH"
                : "BEARISH"
        };
    }
}

/* =========================================
   ATR
========================================= */

class ATR {

    static calculate(candles) {

        const period =
            IndicatorConfig.ATR_PERIOD;

        if (
            candles.length < period
        ) {

            return 0;
        }

        let trs = [];

        for (
            let i = 1;
            i < candles.length;
            i++
        ) {

            const highLow =
                candles[i].high -
                candles[i].low;

            const highClose =
                Math.abs(
                    candles[i].high -
                    candles[i - 1].close
                );

            const lowClose =
                Math.abs(
                    candles[i].low -
                    candles[i - 1].close
                );

            trs.push(
                Math.max(
                    highLow,
                    highClose,
                    lowClose
                )
            );
        }

        const atr =
            trs.reduce(
                (a, b) => a + b,
                0
            ) / trs.length;

        return Number(
            atr.toFixed(2)
        );
    }
}

/* =========================================
   BOLLINGER BANDS
========================================= */

class BollingerBands {

    static calculate(candles) {

        const period =
            IndicatorConfig.BB_PERIOD;

        const sma =
            SMA.calculate(
                candles,
                period
            );

        const sliced =
            candles.slice(-period);

        const variance =
            sliced.reduce(
                (acc, c) => {

                    return (
                        acc +
                        Math.pow(
                            c.close - sma,
                            2
                        )
                    );
                },
                0
            ) / period;

        const stdDev =
            Math.sqrt(variance);

        return {

            upper:
                Number(
                    (
                        sma +
                        (
                            stdDev *
                            IndicatorConfig.BB_STD_DEV
                        )
                    ).toFixed(2)
                ),

            middle: sma,

            lower:
                Number(
                    (
                        sma -
                        (
                            stdDev *
                            IndicatorConfig.BB_STD_DEV
                        )
                    ).toFixed(2)
                )
        };
    }
}

/* =========================================
   VWAP
========================================= */

class VWAP {

    static calculate(candles) {

        let cumulativePV = 0;

        let cumulativeVolume = 0;

        candles.forEach(candle => {

            const typicalPrice =
                (
                    candle.high +
                    candle.low +
                    candle.close
                ) / 3;

            cumulativePV +=
                typicalPrice *
                candle.volume;

            cumulativeVolume +=
                candle.volume;
        });

        if (
            cumulativeVolume === 0
        ) {

            return 0;
        }

        return Number(
            (
                cumulativePV /
                cumulativeVolume
            ).toFixed(2)
        );
    }
}

/* =========================================
   SUPERTREND
========================================= */

class SuperTrend {

    static calculate(candles) {

        const atr =
            ATR.calculate(candles);

        const last =
            candles[
                candles.length - 1
            ];

        const hl2 =
            (
                last.high +
                last.low
            ) / 2;

        const upperBand =
            hl2 +
            (
                IndicatorConfig
                .SUPER_TREND_MULTIPLIER *
                atr
            );

        const lowerBand =
            hl2 -
            (
                IndicatorConfig
                .SUPER_TREND_MULTIPLIER *
                atr
            );

        const trend =
            last.close > upperBand
            ? "BUY"
            : last.close < lowerBand
            ? "SELL"
            : "HOLD";

        return {

            upperBand:
                Number(
                    upperBand.toFixed(2)
                ),

            lowerBand:
                Number(
                    lowerBand.toFixed(2)
                ),

            signal: trend
        };
    }
}

/* =========================================
   MOMENTUM
========================================= */

class Momentum {

    static calculate(candles) {

        if (
            candles.length < 10
        ) {

            return 0;
        }

        const latest =
            candles[
                candles.length - 1
            ].close;

        const previous =
            candles[
                candles.length - 10
            ].close;

        const momentum =
            latest - previous;

        return Number(
            momentum.toFixed(2)
        );
    }
}

/* =========================================
   VOLATILITY
========================================= */

class Volatility {

    static calculate(candles) {

        const returns = [];

        for (
            let i = 1;
            i < candles.length;
            i++
        ) {

            const ret =
                (
                    candles[i].close -
                    candles[i - 1].close
                ) /
                candles[i - 1].close;

            returns.push(ret);
        }

        const avg =
            returns.reduce(
                (a, b) => a + b,
                0
            ) / returns.length;

        const variance =
            returns.reduce(
                (acc, r) => {

                    return (
                        acc +
                        Math.pow(
                            r - avg,
                            2
                        )
                    );
                },
                0
            ) / returns.length;

        return Number(
            (
                Math.sqrt(
                    variance
                ) * 100
            ).toFixed(2)
        );
    }
}

/* =========================================
   TREND STRENGTH
========================================= */

class TrendStrength {

    static calculate(candles) {

        const emaFast =
            EMA.calculate(
                candles,
                9
            );

        const emaSlow =
            EMA.calculate(
                candles,
                21
            );

        const strength =
            emaFast - emaSlow;

        if (strength > 2) {

            return "STRONG_BULLISH";
        }

        if (strength < -2) {

            return "STRONG_BEARISH";
        }

        return "SIDEWAYS";
    }
}

/* =========================================
   VOLUME ANALYSIS
========================================= */

class VolumeAnalysis {

    static calculate(candles) {

        const volumes =
            candles.map(
                c => c.volume
            );

        const avgVolume =
            volumes.reduce(
                (a, b) => a + b,
                0
            ) / volumes.length;

        const latestVolume =
            volumes[
                volumes.length - 1
            ];

        return {

            average:
                Number(
                    avgVolume.toFixed(2)
                ),

            latest:
                latestVolume,

            spike:
                latestVolume >
                avgVolume * 2
        };
    }
}

/* =========================================
   SMART MONEY ENGINE
========================================= */

class SmartMoneyConcept {

    static detect(candles) {

        const latest =
            candles[
                candles.length - 1
            ];

        if (
            latest.volume >
            200000 &&
            latest.close >
            latest.open
        ) {

            return "INSTITUTIONAL_BUYING";
        }

        if (
            latest.volume >
            200000 &&
            latest.close <
            latest.open
        ) {

            return "INSTITUTIONAL_SELLING";
        }

        return "NEUTRAL";
    }
}

/* =========================================
   ORDERFLOW ENGINE
========================================= */

class OrderFlow {

    static analyze(ticks = []) {

        let buyPressure = 0;

        let sellPressure = 0;

        ticks.forEach(tick => {

            if (tick.side === "BUY") {

                buyPressure += tick.volume;

            } else {

                sellPressure += tick.volume;
            }
        });

        return {

            buyPressure,

            sellPressure,

            imbalance:
                buyPressure -
                sellPressure
        };
    }
}

/* =========================================
   MARKET BREADTH
========================================= */

class MarketBreadth {

    static analyze(stocks = []) {

        let advancing = 0;

        let declining = 0;

        stocks.forEach(stock => {

            if (
                stock.change > 0
            ) {

                advancing++;

            } else {

                declining++;
            }
        });

        return {

            advancing,

            declining,

            ratio:
                advancing /
                (
                    declining || 1
                )
        };
    }
}

/* =========================================
   EXPORT ENGINE
========================================= */

window.TradeFinderIndicators = {

    IndicatorEngine,

    RSI,

    EMA,

    SMA,

    MACD,

    ATR,

    BollingerBands,

    VWAP,

    SuperTrend,

    Momentum,

    Volatility,

    TrendStrength,

    VolumeAnalysis,

    SmartMoneyConcept,

    OrderFlow,

    MarketBreadth
};

console.log(
    "Institutional Indicators Engine Ready"
);