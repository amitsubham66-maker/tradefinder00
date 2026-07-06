/* =========================================
   TRADEFINDER AI - AI LEARNING ENGINE
========================================= */

import fs from "fs";

import path from "path";

import Trade from "../models/tradeModel.js";

import AnalyticsEngine from "../analytics/analyticsEngine.js";

/* =========================================
   MODEL STORAGE
========================================= */

const MODEL_DIRECTORY =
    "./backend/ai/models";

/* =========================================
   AI STATE
========================================= */

const AIState = {

    currentVersion: "1.0.0",

    lastTraining: null,

    learningRate: 0.01,

    marketRegime: "UNKNOWN",

    adaptiveConfidence: 75
};

/* =========================================
   AI LEARNING ENGINE
========================================= */

class AILearningEngine {

    /* =====================================
       INITIALIZE AI ENGINE
    ===================================== */

    static initialize() {

        try {

            if (

                !fs.existsSync(
                    MODEL_DIRECTORY
                )

            ) {

                fs.mkdirSync(

                    MODEL_DIRECTORY,

                    {

                        recursive: true
                    }
                );
            }

            console.log(`
=========================================
AI LEARNING ENGINE INITIALIZED
=========================================
`);

        }

        catch (error) {

            console.error(`
=========================================
AI INIT ERROR
=========================================
`);

            console.error(error.message);
        }
    }

    /* =====================================
       FEATURE ENGINEERING
    ===================================== */

    static generateFeatures(trade) {

        try {

            return {

                entry:
                    trade.entryPrice,

                exit:
                    trade.exitPrice || 0,

                pnl:
                    trade.pnl,

                confidence:
                    trade.aiSignal.confidence,

                volatility:
                    trade.volatility || 0,

                volume:
                    trade.volume || 0,

                strategy:
                    trade.aiSignal.strategy,

                signal:
                    trade.aiSignal.signal,

                marketTrend:
                    trade.marketTrend || "SIDEWAYS"
            };

        }

        catch (error) {

            console.error(`
=========================================
FEATURE ENGINEERING ERROR
=========================================
`);

            return {};
        }
    }

    /* =====================================
       MARKET REGIME DETECTION
    ===================================== */

    static detectMarketRegime(data) {

        try {

            const prices =
                data.close;

            const volatility =
                this.calculateVolatility(
                    prices
                );

            const trend =
                prices.at(-1) - prices[0];

            /* =====================
               TRENDING MARKET
            ===================== */

            if (

                Math.abs(trend) > 100 &&

                volatility < 2

            ) {

                AIState.marketRegime =
                    "TRENDING";
            }

            /* =====================
               VOLATILE MARKET
            ===================== */

            else if (

                volatility > 5

            ) {

                AIState.marketRegime =
                    "VOLATILE";
            }

            /* =====================
               SIDEWAYS MARKET
            ===================== */

            else {

                AIState.marketRegime =
                    "SIDEWAYS";
            }

            return AIState.marketRegime;

        }

        catch (error) {

            console.error(`
=========================================
MARKET REGIME ERROR
=========================================
`);

            return "UNKNOWN";
        }
    }

    /* =====================================
       VOLATILITY CALCULATION
    ===================================== */

    static calculateVolatility(prices) {

        try {

            const returns = [];

            for (

                let i = 1;

                i < prices.length;

                i++

            ) {

                returns.push(

                    (

                        prices[i] -

                        prices[i - 1]

                    )

                    /

                    prices[i - 1]
                );
            }

            const avg =

                returns.reduce(

                    (a, b) => a + b,

                    0
                )

                / returns.length;

            const variance =

                returns.reduce(

                    (sum, value) =>

                        sum +

                        Math.pow(

                            value - avg,

                            2
                        ),

                    0
                )

                / returns.length;

            return Number(

                Math.sqrt(
                    variance
                ).toFixed(2)
            );

        }

        catch (error) {

            console.error(`
=========================================
VOLATILITY ERROR
=========================================
`);

            return 0;
        }
    }

    /* =====================================
       TRAIN AI MODEL
    ===================================== */

    static async trainModel() {

        try {

            const trades =
                await Trade.find();

            const dataset =
                trades.map(trade =>

                    this.generateFeatures(
                        trade
                    )
                );

            /* =====================
               MODEL METADATA
            ===================== */

            const modelData = {

                version:

                    this.generateNewVersion(),

                trainedAt:
                    new Date(),

                datasetSize:
                    dataset.length,

                marketRegime:
                    AIState.marketRegime,

                adaptiveConfidence:
                    AIState.adaptiveConfidence,

                learningRate:
                    AIState.learningRate
            };

            /* =====================
               SAVE MODEL
            ===================== */

            const modelPath =

                path.join(

                    MODEL_DIRECTORY,

                    `model-${modelData.version}.json`
                );

            fs.writeFileSync(

                modelPath,

                JSON.stringify(

                    {

                        modelData,

                        dataset
                    },

                    null,

                    2
                )
            );

            AIState.currentVersion =
                modelData.version;

            AIState.lastTraining =
                new Date();

            console.log(`
=========================================
AI MODEL TRAINED
=========================================
`);

            return {

                success: true,

                modelData
            };

        }

        catch (error) {

            console.error(`
=========================================
TRAIN MODEL ERROR
=========================================
`);

            console.error(error.message);

            return {

                success: false
            };
        }
    }

    /* =====================================
       GENERATE NEW VERSION
    ===================================== */

    static generateNewVersion() {

        const parts =
            AIState.currentVersion
            .split(".");

        parts[2] =
            parseInt(parts[2]) + 1;

        return parts.join(".");
    }

    /* =====================================
       ADAPTIVE CONFIDENCE
    ===================================== */

    static async optimizeConfidence() {

        try {

            const analytics =
                await AnalyticsEngine
                .getAIAccuracy();

            /* =====================
               IMPROVE CONFIDENCE
            ===================== */

            if (

                analytics.accuracy > 75

            ) {

                AIState.adaptiveConfidence +=
                    1;
            }

            /* =====================
               REDUCE CONFIDENCE
            ===================== */

            else {

                AIState.adaptiveConfidence -=
                    1;
            }

            /* =====================
               LIMIT RANGE
            ===================== */

            if (

                AIState.adaptiveConfidence >
                95

            ) {

                AIState.adaptiveConfidence =
                    95;
            }

            if (

                AIState.adaptiveConfidence <
                60

            ) {

                AIState.adaptiveConfidence =
                    60;
            }

            return {

                adaptiveConfidence:

                    AIState
                    .adaptiveConfidence
            };

        }

        catch (error) {

            console.error(`
=========================================
CONFIDENCE OPTIMIZATION ERROR
=========================================
`);

            return {};
        }
    }

    /* =====================================
       LEARN FROM TRADE
    ===================================== */

    static async learnFromTrade(trade) {

        try {

            const feature =
                this.generateFeatures(
                    trade
                );

            /* =====================
               WINNING TRADE
            ===================== */

            if (trade.pnl > 0) {

                AIState.learningRate +=
                    0.001;
            }

            /* =====================
               LOSING TRADE
            ===================== */

            else {

                AIState.learningRate -=
                    0.001;
            }

            /* =====================
               LEARNING RATE LIMIT
            ===================== */

            if (

                AIState.learningRate <
                0.001

            ) {

                AIState.learningRate =
                    0.001;
            }

            console.log(`
=========================================
AI LEARNED FROM TRADE
=========================================
`);

            return feature;

        }

        catch (error) {

            console.error(`
=========================================
LEARN TRADE ERROR
=========================================
`);

            return {};
        }
    }

    /* =====================================
       GET AI STATUS
    ===================================== */

    static getAIStatus() {

        return {

            version:
                AIState.currentVersion,

            lastTraining:
                AIState.lastTraining,

            learningRate:
                AIState.learningRate,

            marketRegime:
                AIState.marketRegime,

            adaptiveConfidence:
                AIState.adaptiveConfidence
        };
    }
}

/* =========================================
   INITIALIZE ENGINE
========================================= */

AILearningEngine.initialize();

/* =========================================
   EXPORT
========================================= */

export default AILearningEngine;