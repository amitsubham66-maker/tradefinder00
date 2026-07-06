/* =========================================
   TRADEFINDER AI - STRATEGY ENGINE
========================================= */

import IndicatorEngine from "../indicators/indicator.js";

import RiskManager from "../risk/riskManager.js";

/* =========================================
   STRATEGY CONFIG
========================================= */

const StrategyConfig = {

    MIN_CONFIDENCE: 75,

    RSI_OVERBOUGHT: 70,

    RSI_OVERSOLD: 30,

    VOLUME_MULTIPLIER: 1.5,

    BREAKOUT_THRESHOLD: 0.5
};

/* =========================================
   STRATEGY ENGINE
========================================= */

class StrategyEngine {

    /* =====================================
       MAIN ANALYZER
    ===================================== */

    static analyzeMarket(data) {

        try {

            const indicators =

                IndicatorEngine
                .calculateAllIndicators(data);

            const strategies = {

                scalping:
                    this.scalpingStrategy(
                        data,
                        indicators
                    ),

                breakout:
                    this.breakoutStrategy(
                        data,
                        indicators
                    ),

                reversal:
                    this.reversalStrategy(
                        data,
                        indicators
                    ),

                options:
                    this.optionsStrategy(
                        data,
                        indicators
                    ),

                smartMoney:
                    this.smartMoneyStrategy(
                        data,
                        indicators
                    )
            };

            return strategies;

        }

        catch (error) {

            console.error(`
=========================================
STRATEGY ENGINE ERROR
=========================================
`);

            console.error(error.message);

            return {};
        }
    }

    /* =====================================
       SCALPING STRATEGY
    ===================================== */

    static scalpingStrategy(

        data,

        indicators

    ) {

        try {

            const latestPrice =
                data.close.at(-1);

            const rsi =
                indicators.rsi;

            const vwap =
                indicators.vwap;

            const volumeSpike =
                indicators.volumeSpike;

            let signal =
                "NEUTRAL";

            let confidence = 0;

            /* =====================
               BUY SETUP
            ===================== */

            if (

                latestPrice > vwap &&

                rsi > 55 &&

                volumeSpike

            ) {

                signal =
                    "BUY";

                confidence = 85;
            }

            /* =====================
               SELL SETUP
            ===================== */

            if (

                latestPrice < vwap &&

                rsi < 45 &&

                volumeSpike

            ) {

                signal =
                    "SELL";

                confidence = 82;
            }

            return {

                strategy:
                    "SCALPING",

                signal,

                confidence,

                entry:
                    latestPrice,

                stoploss:

                    signal === "BUY"

                    ? latestPrice - 10

                    : latestPrice + 10,

                target:

                    signal === "BUY"

                    ? latestPrice + 20

                    : latestPrice - 20
            };

        }

        catch (error) {

            console.error(`
=========================================
SCALPING STRATEGY ERROR
=========================================
`);

            return {};
        }
    }

    /* =====================================
       BREAKOUT STRATEGY
    ===================================== */

    static breakoutStrategy(

        data,

        indicators

    ) {

        try {

            const high =
                Math.max(...data.high);

            const low =
                Math.min(...data.low);

            const current =
                data.close.at(-1);

            const volumeSpike =
                indicators.volumeSpike;

            let signal =
                "NO_BREAKOUT";

            let confidence = 0;

            /* =====================
               BREAKOUT
            ===================== */

            if (

                current >

                high *

                (

                    1 +
                    StrategyConfig
                    .BREAKOUT_THRESHOLD
                    / 100
                )

                &&

                volumeSpike

            ) {

                signal =
                    "BREAKOUT_BUY";

                confidence = 90;
            }

            /* =====================
               BREAKDOWN
            ===================== */

            if (

                current <

                low *

                (

                    1 -
                    StrategyConfig
                    .BREAKOUT_THRESHOLD
                    / 100
                )

                &&

                volumeSpike

            ) {

                signal =
                    "BREAKDOWN_SELL";

                confidence = 88;
            }

            return {

                strategy:
                    "BREAKOUT",

                signal,

                confidence
            };

        }

        catch (error) {

            console.error(`
=========================================
BREAKOUT STRATEGY ERROR
=========================================
`);

            return {};
        }
    }

    /* =====================================
       REVERSAL STRATEGY
    ===================================== */

    static reversalStrategy(

        data,

        indicators

    ) {

        try {

            const rsi =
                indicators.rsi;

            const macd =
                indicators.macd;

            let signal =
                "NO_REVERSAL";

            let confidence = 0;

            /* =====================
               BULLISH REVERSAL
            ===================== */

            if (

                rsi < 30 &&

                macd.histogram > 0

            ) {

                signal =
                    "BULLISH_REVERSAL";

                confidence = 84;
            }

            /* =====================
               BEARISH REVERSAL
            ===================== */

            if (

                rsi > 70 &&

                macd.histogram < 0

            ) {

                signal =
                    "BEARISH_REVERSAL";

                confidence = 86;
            }

            return {

                strategy:
                    "REVERSAL",

                signal,

                confidence
            };

        }

        catch (error) {

            console.error(`
=========================================
REVERSAL STRATEGY ERROR
=========================================
`);

            return {};
        }
    }

    /* =====================================
       OPTIONS STRATEGY
    ===================================== */

    static optionsStrategy(

        data,

        indicators

    ) {

        try {

            const pcr =
                data.pcr || 1;

            const oi =
                data.oi || 0;

            let signal =
                "NEUTRAL";

            let confidence = 0;

            if (

                pcr > 1.2 &&

                oi > 1000000

            ) {

                signal =
                    "CALL_BUY";

                confidence = 80;
            }

            if (

                pcr < 0.7 &&

                oi > 1000000

            ) {

                signal =
                    "PUT_BUY";

                confidence = 82;
            }

            return {

                strategy:
                    "OPTIONS",

                signal,

                confidence
            };

        }

        catch (error) {

            console.error(`
=========================================
OPTIONS STRATEGY ERROR
=========================================
`);

            return {};
        }
    }

    /* =====================================
       SMART MONEY STRATEGY
    ===================================== */

    static smartMoneyStrategy(

        data,

        indicators

    ) {

        try {

            const latest =
                data.close.at(-1);

            const previous =
                data.close.at(-2);

            let signal =
                "NO_STRUCTURE";

            let confidence = 0;

            /* =====================
               BOS
            ===================== */

            if (

                latest > previous * 1.01

            ) {

                signal =
                    "BOS_BULLISH";

                confidence = 87;
            }

            /* =====================
               CHOCH
            ===================== */

            if (

                latest < previous * 0.99

            ) {

                signal =
                    "CHOCH_BEARISH";

                confidence = 85;
            }

            return {

                strategy:
                    "SMART_MONEY",

                signal,

                confidence
            };

        }

        catch (error) {

            console.error(`
=========================================
SMART MONEY ERROR
=========================================
`);

            return {};
        }
    }

    /* =====================================
       SELECT BEST STRATEGY
    ===================================== */

    static selectBestStrategy(

        strategies

    ) {

        try {

            const allStrategies =

                Object.values(strategies);

            const best =

                allStrategies.reduce(

                    (prev, current) =>

                        current.confidence >

                        prev.confidence

                        ? current

                        : prev
                );

            return best;

        }

        catch (error) {

            console.error(`
=========================================
BEST STRATEGY ERROR
=========================================
`);

            return {};
        }
    }

    /* =====================================
       EXECUTE STRATEGY
    ===================================== */

    static executeStrategy(

        strategy,

        accountBalance

    ) {

        try {

            const riskCheck =

                RiskManager
                .validateTrade(

                    strategy,

                    accountBalance
                );

            if (!riskCheck.allowed) {

                return {

                    success: false,

                    reason:
                        riskCheck.reason
                };
            }

            return {

                success: true,

                strategy,

                quantity:
                    riskCheck.quantity
            };

        }

        catch (error) {

            console.error(`
=========================================
EXECUTE STRATEGY ERROR
=========================================
`);

            return {

                success: false
            };
        }
    }
}

/* =========================================
   EXPORT
========================================= */

export default StrategyEngine;