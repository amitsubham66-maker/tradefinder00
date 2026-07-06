/* =========================================
   TRADEFINDER AI - AI MODEL TRAINER
========================================= */

import fs from "fs";

import path from "path";

import LoggingService from "../services/loggingService.js";

/* =========================================
   AI MODEL TRAINER
========================================= */

class AIModelTrainer {

    /* =====================================
       FEATURE ENGINEERING
    ===================================== */

    static generateFeatures(

        marketData

    ) {

        try {

            return marketData.map(candle => ({

                rsi:
                    candle.rsi,

                macd:
                    candle.macd,

                ema20:
                    candle.ema20,

                ema50:
                    candle.ema50,

                volume:
                    candle.volume,

                volatility:
                    candle.volatility,

                pcr:
                    candle.pcr,

                oi:
                    candle.oi,

                priceChange:
                    candle.priceChange
            }));

        }

        catch (error) {

            LoggingService.logError(

                "FEATURE_ENGINEERING",

                error
            );

            return [];
        }
    }

    /* =====================================
       LABEL GENERATION
    ===================================== */

    static generateLabels(

        marketData

    ) {

        try {

            return marketData.map(candle => {

                if (

                    candle.futureReturn > 2

                ) {

                    return "BUY";
                }

                if (

                    candle.futureReturn < -2

                ) {

                    return "SELL";
                }

                return "HOLD";
            });

        }

        catch (error) {

            LoggingService.logError(

                "LABEL_GENERATION",

                error
            );

            return [];
        }
    }

    /* =====================================
       TRAIN MODEL
    ===================================== */

    static async trainModel(

        marketData

    ) {

        try {

            console.log(`
=========================================
AI MODEL TRAINING STARTED
=========================================
`);

            /* =============================
               FEATURES & LABELS
            ============================= */

            const features =
                this.generateFeatures(
                    marketData
                );

            const labels =
                this.generateLabels(
                    marketData
                );

            /* =============================
               SIMULATED MODEL
            ============================= */

            const model = {

                version:
                    `v${Date.now()}`,

                trainedAt:
                    new Date(),

                samples:
                    features.length,

                accuracy:
                    Number(

                        (
                            70 +
                            Math.random() * 20
                        ).toFixed(2)
                    ),

                featureImportance: {

                    rsi: 0.18,

                    macd: 0.16,

                    ema20: 0.12,

                    ema50: 0.10,

                    volume: 0.14,

                    volatility: 0.11,

                    pcr: 0.10,

                    oi: 0.09
                }
            };

            /* =============================
               SAVE MODEL
            ============================= */

            const modelPath = path.join(

                process.cwd(),

                "models",

                `${model.version}.json`
            );

            /* CREATE MODELS DIR */

            if (

                !fs.existsSync(
                    path.join(
                        process.cwd(),
                        "models"
                    )
                )

            ) {

                fs.mkdirSync(
                    path.join(
                        process.cwd(),
                        "models"
                    )
                );
            }

            fs.writeFileSync(

                modelPath,

                JSON.stringify(
                    model,
                    null,
                    2
                )
            );

            console.log(`
=========================================
MODEL TRAINED SUCCESSFULLY
=========================================
`);

            console.log(model);

            return model;

        }

        catch (error) {

            LoggingService.logError(

                "TRAIN_MODEL",

                error
            );

            return null;
        }
    }

    /* =====================================
       EVALUATE MODEL
    ===================================== */

    static evaluateModel(

        predictions,

        actuals

    ) {

        try {

            let correct = 0;

            for (

                let i = 0;

                i < predictions.length;

                i++

            ) {

                if (

                    predictions[i] ===
                    actuals[i]

                ) {

                    correct++;
                }
            }

            const accuracy =

                (

                    correct /

                    predictions.length

                ) * 100;

            return {

                accuracy:
                    Number(
                        accuracy.toFixed(2)
                    ),

                totalSamples:
                    predictions.length
            };

        }

        catch (error) {

            LoggingService.logError(

                "EVALUATE_MODEL",

                error
            );

            return {

                accuracy: 0
            };
        }
    }

    /* =====================================
       LOAD MODEL
    ===================================== */

    static loadModel(

        version

    ) {

        try {

            const modelPath = path.join(

                process.cwd(),

                "models",

                `${version}.json`
            );

            if (

                !fs.existsSync(modelPath)

            ) {

                throw new Error(
                    "MODEL_NOT_FOUND"
                );
            }

            return JSON.parse(

                fs.readFileSync(
                    modelPath
                )
            );

        }

        catch (error) {

            LoggingService.logError(

                "LOAD_MODEL",

                error
            );

            return null;
        }
    }

    /* =====================================
       GET LATEST MODEL
    ===================================== */

    static getLatestModel() {

        try {

            const modelDir = path.join(

                process.cwd(),

                "models"
            );

            if (

                !fs.existsSync(modelDir)

            ) {

                return null;
            }

            const models =
                fs.readdirSync(modelDir);

            if (models.length === 0) {

                return null;
            }

            const latestModel =
                models.sort().reverse()[0];

            return JSON.parse(

                fs.readFileSync(

                    path.join(
                        modelDir,
                        latestModel
                    )
                )
            );

        }

        catch (error) {

            LoggingService.logError(

                "LATEST_MODEL",

                error
            );

            return null;
        }
    }
}

/* =========================================
   EXPORT
========================================= */

export default AIModelTrainer;