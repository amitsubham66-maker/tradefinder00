/* =========================================
   TRADEFINDER AI - MARKET REGIME ENGINE
========================================= */

import IndicatorEngine from "../indicators/indicator.js";

import RedisService from "../services/redisService.js";

import WebsocketCluster from "../websocket/websocketCluster.js";

import LoggingService from "../services/loggingService.js";

/* =========================================
   REGIME ENGINE
========================================= */

class MarketRegimeEngine {

    /* =====================================
       DETECT MARKET REGIME
    ===================================== */

    static async detectRegime(

        marketData,

        optionsData

    ) {

        try {

            /* =============================
               INDICATORS
            ============================= */

            const ema20 =
                IndicatorEngine.calculateEMA(
                    marketData.history,
                    20
                );

            const ema50 =
                IndicatorEngine.calculateEMA(
                    marketData.history,
                    50
                );

            const rsi =
                IndicatorEngine.calculateRSI(
                    marketData.history
                );

            const atr =
                this.calculateATR(
                    marketData.history
                );

            const adx =
                this.calculateADX(
                    marketData.history
                );

            /* =============================
               OPTIONS SENTIMENT
            ============================= */

            const pcr =

                optionsData.putOI /

                optionsData.callOI;

            /* =============================
               VOLATILITY SCORE
            ============================= */

            const volatilityScore =

                (

                    atr /

                    marketData.ltp

                ) * 100;

            /* =============================
               TREND STRENGTH
            ============================= */

            let regime = "SIDEWAYS";

            let strategy = "MEAN_REVERSION";

            /* STRONG BULLISH */

            if (

                ema20 > ema50 &&

                adx > 25 &&

                rsi > 55 &&

                pcr > 1

            ) {

                regime = "BULLISH_TREND";

                strategy = "MOMENTUM_BUY";
            }

            /* STRONG BEARISH */

            else if (

                ema20 < ema50 &&

                adx > 25 &&

                rsi < 45 &&

                pcr < 0.8

            ) {

                regime = "BEARISH_TREND";

                strategy = "SHORT_SELLING";
            }

            /* HIGH VOLATILITY */

            else if (

                volatilityScore > 3

            ) {

                regime = "HIGH_VOLATILITY";

                strategy = "VOLATILITY_SCALPING";
            }

            /* BREAKOUT */

            else if (

                adx > 35 &&

                volatilityScore > 2

            ) {

                regime = "BREAKOUT";

                strategy = "BREAKOUT_TRADING";
            }

            /* LOW LIQUIDITY */

            else if (

                marketData.volume <

                marketData.avgVolume * 0.5

            ) {

                regime = "LOW_LIQUIDITY";

                strategy = "NO_TRADE";
            }

            /* =============================
               REGIME OBJECT
            ============================= */

            const regimeData = {

                symbol:
                    marketData.symbol,

                regime,

                strategy,

                indicators: {

                    ema20,

                    ema50,

                    rsi,

                    atr,

                    adx,

                    pcr
                },

                volatilityScore:
                    Number(
                        volatilityScore.toFixed(2)
                    ),

                timestamp:
                    new Date()
            };

            /* =============================
               CACHE REGIME
            ============================= */

            await RedisService.set(

                `regime:${marketData.symbol}`,

                regimeData,

                60
            );

            /* =============================
               BROADCAST REGIME
            ============================= */

            await WebsocketCluster
            .publishMarketData({

                type:
                    "MARKET_REGIME",

                regime:
                    regimeData
            });

            return regimeData;

        }

        catch (error) {

            LoggingService.logError(

                "MARKET_REGIME_ENGINE",

                error
            );

            return {

                regime: "UNKNOWN"
            };
        }
    }

    /* =====================================
       ATR CALCULATION
    ===================================== */

    static calculateATR(

        history,

        period = 14

    ) {

        try {

            const trs = [];

            for (

                let i = 1;

                i < history.length;

                i++

            ) {

                const high =
                    history[i].high;

                const low =
                    history[i].low;

                const prevClose =
                    history[i - 1].close;

                const tr = Math.max(

                    high - low,

                    Math.abs(
                        high - prevClose
                    ),

                    Math.abs(
                        low - prevClose
                    )
                );

                trs.push(tr);
            }

            const atr =

                trs

                .slice(-period)

                .reduce(

                    (sum, tr) => sum + tr,

                    0
                ) / period;

            return Number(
                atr.toFixed(2)
            );

        }

        catch (error) {

            LoggingService.logError(

                "ATR_CALCULATION",

                error
            );

            return 0;
        }
    }

    /* =====================================
       ADX CALCULATION
    ===================================== */

    static calculateADX(

        history,

        period = 14

    ) {

        try {

            /* SIMPLIFIED ADX */

            let directionalMovement = 0;

            for (

                let i = 1;

                i < history.length;

                i++

            ) {

                directionalMovement += Math.abs(

                    history[i].close -

                    history[i - 1].close
                );
            }

            const adx =

                directionalMovement /

                period;

            return Number(
                adx.toFixed(2)
            );

        }

        catch (error) {

            LoggingService.logError(

                "ADX_CALCULATION",

                error
            );

            return 0;
        }
    }

    /* =====================================
       GET REGIME
    ===================================== */

    static async getRegime(symbol) {

        try {

            return await RedisService.get(
                `regime:${symbol}`
            );

        }

        catch (error) {

            LoggingService.logError(

                "GET_REGIME",

                error
            );

            return null;
        }
    }
}

/* =========================================
   EXPORT
========================================= */

export default MarketRegimeEngine;