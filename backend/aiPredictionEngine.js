/* =========================================
   TRADEFINDER AI - AI PREDICTION ENGINE
========================================= */

import AIModelTrainer from "./aiModelTrainer.js";

import ReinforcementLearningEngine
from "./Backend/reinforcementLearningEngine.js";

import LoggingService
from "../services/loggingService.js";

import WebsocketCluster
from "../websocket/websocketCluster.js";

/* =========================================
   AI PREDICTION ENGINE
========================================= */

class AIPredictionEngine {

    /* =====================================
       LOAD MODEL
    ===================================== */

    static model =
        AIModelTrainer.getLatestModel();

    /* =====================================
       GENERATE PREDICTION
    ===================================== */

    static async generatePrediction(

        marketData,

        indicators,

        sentiment = null

    ) {

        try {

            /* =============================
               RL DECISION
            ============================= */

            const rlDecision =

                ReinforcementLearningEngine
                .getAIDecision({

                    marketRegime:
                        marketData.marketRegime,

                    volatilityLevel:
                        marketData.volatilityLevel,

                    trend:
                        marketData.trend,

                    rsiZone:
                        indicators.rsi > 70

                        ?

                        "OVERBOUGHT"

                        :

                        indicators.rsi < 30

                        ?

                        "OVERSOLD"

                        :

                        "NEUTRAL"
                });

            /* =============================
               ML FEATURE SCORE
            ============================= */

            let score = 0;

            /* RSI */

            if (indicators.rsi < 30) {

                score += 15;
            }

            if (indicators.rsi > 70) {

                score -= 15;
            }

            /* MACD */

            if (indicators.macd > 0) {

                score += 12;
            }

            else {

                score -= 12;
            }

            /* EMA */

            if (

                indicators.ema20 >

                indicators.ema50

            ) {

                score += 10;
            }

            else {

                score -= 10;
            }

            /* VOLUME */

            if (

                indicators.volumeSpike

            ) {

                score += 8;
            }

            /* TREND */

            if (

                marketData.trend ===
                "BULLISH"

            ) {

                score += 10;
            }

            if (

                marketData.trend ===
                "BEARISH"

            ) {

                score -= 10;
            }

            /* SENTIMENT */

            if (sentiment) {

                score +=
                    sentiment.score || 0;
            }

            /* RL BOOST */

            if (

                rlDecision.action ===
                "BUY"

            ) {

                score += 10;
            }

            if (

                rlDecision.action ===
                "SELL"

            ) {

                score -= 10;
            }

            /* =============================
               FINAL SIGNAL
            ============================= */

            let signal = "HOLD";

            if (score >= 20) {

                signal = "BUY";
            }

            else if (score <= -20) {

                signal = "SELL";
            }

            /* =============================
               CONFIDENCE
            ============================= */

            const confidence = Math.min(

                Math.abs(score) +

                rlDecision.confidence,

                99
            );

            const prediction = {

                timestamp:
                    new Date(),

                signal,

                confidence:
                    Number(
                        confidence.toFixed(2)
                    ),

                score,

                marketRegime:
                    marketData.marketRegime,

                rlDecision,

                indicators: {

                    rsi:
                        indicators.rsi,

                    macd:
                        indicators.macd,

                    ema20:
                        indicators.ema20,

                    ema50:
                        indicators.ema50
                }
            };

            /* =============================
               BROADCAST
            ============================= */

            await WebsocketCluster
            .publishAISignal({

                type:
                    "AI_PREDICTION",

                prediction
            });

            return prediction;

        }

        catch (error) {

            LoggingService.logError(

                "AI_PREDICTION",

                error
            );

            return {

                signal: "HOLD",

                confidence: 0
            };
        }
    }

    /* =====================================
       BATCH PREDICTIONS
    ===================================== */

    static async batchPredict(

        symbolsData

    ) {

        try {

            const predictions = [];

            for (

                const data of symbolsData

            ) {

                const prediction =

                    await this
                    .generatePrediction(

                        data.marketData,

                        data.indicators,

                        data.sentiment
                    );

                predictions.push({

                    symbol:
                        data.symbol,

                    prediction
                });
            }

            return predictions;

        }

        catch (error) {

            LoggingService.logError(

                "BATCH_PREDICT",

                error
            );

            return [];
        }
    }

    /* =====================================
       FILTER HIGH CONFIDENCE
    ===================================== */

    static filterHighConfidence(

        predictions,

        minConfidence = 75

    ) {

        try {

            return predictions.filter(

                prediction =>

                    prediction.prediction
                    .confidence >=
                    minConfidence
            );

        }

        catch (error) {

            LoggingService.logError(

                "HIGH_CONFIDENCE_FILTER",

                error
            );

            return [];
        }
    }
}

/* =========================================
   EXPORT
========================================= */

export default AIPredictionEngine;