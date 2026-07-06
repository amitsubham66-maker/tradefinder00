/* =========================================
   TRADEFINDER AI - AI SIGNAL ENGINE
========================================= */

import IndicatorEngine from "../indicators/indicator.js";

import AnalyticsRealtimeEngine from "../analytics/analyticsRealtimeEngine.js";

import RedisService from "../services/redisService.js";

import WebsocketCluster from "../websocket/websocketCluster.js";

import LoggingService from "../services/loggingService.js";

/* =========================================
   SIGNAL ENGINE
========================================= */

class AISignalEngine {

    /* =====================================
       GENERATE AI SIGNAL
    ===================================== */

    static async generateSignal(

        marketData,

        optionData

    ) {

        try {

            /* =============================
               INDICATORS
            ============================= */

            const rsi =
                IndicatorEngine.calculateRSI(
                    marketData.history
                );

            const macd =
                IndicatorEngine.calculateMACD(
                    marketData.history
                );

            const ema =
                IndicatorEngine.calculateEMA(

                    marketData.history,

                    20
                );

            const vwap =
                IndicatorEngine.calculateVWAP(
                    marketData
                );

            /* =============================
               OPTIONS FLOW
            ============================= */

            const optionsFlow =
                AnalyticsRealtimeEngine
                .analyzeOptionsFlow(
                    optionData
                );

            /* =============================
               INSTITUTIONAL FLOW
            ============================= */

            const institutionalFlow =
                AnalyticsRealtimeEngine
                .detectInstitutionalFlow(
                    marketData
                );

            /* =============================
               MARKET REGIME
            ============================= */

            const marketRegime =
                AnalyticsRealtimeEngine
                .detectMarketRegime([
                    marketData
                ]);

            /* =============================
               AI CONFIDENCE
            ============================= */

            let confidence = 0;

            /* RSI */

            if (rsi < 30) {

                confidence += 20;
            }

            if (rsi > 70) {

                confidence -= 20;
            }

            /* MACD */

            if (macd.signal === "BUY") {

                confidence += 25;
            }

            if (macd.signal === "SELL") {

                confidence -= 25;
            }

            /* VWAP */

            if (

                marketData.ltp > vwap

            ) {

                confidence += 15;
            }

            /* OPTIONS FLOW */

            if (

                optionsFlow.sentiment ===
                "BULLISH"

            ) {

                confidence += 20;
            }

            /* INSTITUTIONAL FLOW */

            if (

                institutionalFlow
                .institutionalActivity

            ) {

                confidence += 25;
            }

            /* MARKET REGIME FILTER */

            if (

                marketRegime ===
                "SIDEWAYS"

            ) {

                confidence -= 15;
            }

            /* =============================
               SIGNAL GENERATION
            ============================= */

            let signal = "HOLD";

            if (confidence >= 70) {

                signal = "BUY";
            }

            if (confidence <= -50) {

                signal = "SELL";
            }

            /* =============================
               STOPLOSS / TARGET
            ============================= */

            const stoploss =

                signal === "BUY"

                ?

                marketData.ltp * 0.985

                :

                marketData.ltp * 1.015;

            const target =

                signal === "BUY"

                ?

                marketData.ltp * 1.03

                :

                marketData.ltp * 0.97;

            /* =============================
               FINAL SIGNAL OBJECT
            ============================= */

            const aiSignal = {

                symbol:
                    marketData.symbol,

                signal,

                confidence:
                    Math.abs(confidence),

                marketRegime,

                indicators: {

                    rsi,

                    macd,

                    ema,

                    vwap
                },

                optionsFlow,

                institutionalFlow,

                entry:
                    marketData.ltp,

                stoploss:
                    Number(
                        stoploss.toFixed(2)
                    ),

                target:
                    Number(
                        target.toFixed(2)
                    ),

                timestamp:
                    new Date()
            };

            /* =============================
               CACHE SIGNAL
            ============================= */

            await RedisService.cacheAISignal(

                marketData.symbol,

                aiSignal
            );

            /* =============================
               BROADCAST SIGNAL
            ============================= */

            await WebsocketCluster
            .publishAISignal(aiSignal);

            /* =============================
               LOG AI SIGNAL
            ============================= */

            LoggingService.logAISignal({

                symbol:
                    aiSignal.symbol,

                signal:
                    aiSignal.signal,

                strategy:
                    "MULTI_FACTOR_AI",

                confidence:
                    aiSignal.confidence
            });

            return aiSignal;

        }

        catch (error) {

            LoggingService.logError(

                "AI_SIGNAL_ENGINE",

                error
            );

            return {

                signal: "ERROR"
            };
        }
    }

    /* =====================================
       BATCH SIGNAL GENERATION
    ===================================== */

    static async generateBatchSignals(

        stocks,

        optionsMap

    ) {

        try {

            const signals = [];

            for (const stock of stocks) {

                const signal =
                    await this.generateSignal(

                        stock,

                        optionsMap[
                            stock.symbol
                        ]
                    );

                signals.push(signal);
            }

            /* =============================
               SORT BEST SIGNALS
            ============================= */

            return signals.sort(

                (a, b) =>

                    b.confidence -

                    a.confidence
            );

        }

        catch (error) {

            LoggingService.logError(

                "BATCH_SIGNALS",

                error
            );

            return [];
        }
    }

    /* =====================================
       SIGNAL QUALITY SCORE
    ===================================== */

    static calculateSignalQuality(

        signal

    ) {

        try {

            let quality = 0;

            if (

                signal.confidence > 80

            ) {

                quality += 40;
            }

            if (

                signal.institutionalFlow
                .institutionalActivity

            ) {

                quality += 30;
            }

            if (

                signal.optionsFlow
                .sentiment === "BULLISH"

            ) {

                quality += 20;
            }

            if (

                signal.marketRegime ===
                "TRENDING"

            ) {

                quality += 10;
            }

            return quality;

        }

        catch (error) {

            LoggingService.logError(

                "SIGNAL_QUALITY",

                error
            );

            return 0;
        }
    }
}

/* =========================================
   EXPORT
========================================= */

export default AISignalEngine;