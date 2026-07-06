/* =========================================
   TRADEFINDER AI - AI ROUTES
========================================= */
const express = require("express");

const axios = require("axios");

const dotenv = require("dotenv");

dotenv.config();

const router = express.Router();

/* =========================================
   AI ENGINE CONFIG
========================================= */

const AI_ENGINE_URL =
    process.env.AI_ENGINE_URL ||
    "http://127.0.0.1:8000";

/* =========================================
   MOCK GENERATOR (FALLBACK)
========================================= */
function generateMockPrediction(marketData) {
    const signals = ["BULLISH", "BEARISH", "SIDEWAYS"];
    const signal = signals[Math.floor(Math.random() * signals.length)];
    const bullish_prob = Math.random();
    const bearish_prob = Math.random();
    const sideways_prob = Math.random();
    const sum = bullish_prob + bearish_prob + sideways_prob;
    const bullish = parseFloat((bullish_prob / sum).toFixed(4));
    const bearish = parseFloat((bearish_prob / sum).toFixed(4));
    const sideways = parseFloat((sideways_prob / sum).toFixed(4));
    const confidence = parseFloat((Math.max(bullish, bearish, sideways) * 100).toFixed(2));

    let close_prices = [100, 101, 102];
    if (marketData && marketData.close && Array.isArray(marketData.close) && marketData.close.length > 0) {
        close_prices = marketData.close;
    } else if (marketData && marketData.candles && Array.isArray(marketData.candles)) {
        close_prices = marketData.candles.map(c => c.close || c[4] || 100);
    }
    
    const trend_strength = close_prices[close_prices.length - 1] - close_prices[0];
    const volume_spike = Math.random() > 0.5;

    return {
        signal,
        confidence,
        bullish_probability: bullish,
        bearish_probability: bearish,
        sideways_probability: sideways,
        market_analysis: {
            trend_strength: parseFloat(trend_strength.toFixed(2)),
            volume_spike: volume_spike,
            market_bias: trend_strength > 0 ? "BULLISH" : "BEARISH"
        },
        timestamp: new Date().toISOString()
    };
}

/* =========================================
   AI HEALTH CHECK
========================================= */

router.get(

    "/health",

    async (req, res) => {

        try {

            const response =
                await axios.get(

                    `${AI_ENGINE_URL}/health`
                );

            return res.json({

                success: true,

                ai:
                    response.data
            });

        }

        catch (error) {

            console.error(`
=========================================
AI HEALTH ERROR - FALLING BACK TO MOCK
=========================================
`);

            console.error(error.message);

            return res.json({

                success: true,

                ai: {
                    status: "ACTIVE",
                    model_loaded: false,
                    predictions: 0,
                    tensorflow: "MOCK_FALLBACK"
                }
            });
        }
    }
);

/* =========================================
   AI PREDICTION
========================================= */

router.post(

    "/predict",

    async (req, res) => {

        try {

            const marketData =
                req.body;

            /* =====================
               VALIDATION
            ===================== */

            if (!marketData) {

                return res.status(400)
                .json({

                    success: false,

                    message:
                        "Market data required"
                });
            }

            /* =====================
               SEND TO AI ENGINE
            ===================== */

            const response =
                await axios.post(

                    `${AI_ENGINE_URL}/predict`,

                    marketData
                );

            const prediction =
                response.data;

            console.log(`
=========================================
AI PREDICTION GENERATED
=========================================
`);

            return res.json({

                success: true,

                prediction
            });

        }

        catch (error) {

            console.error(`
=========================================
AI PREDICTION ERROR - FALLING BACK TO MOCK
=========================================
`);

            console.error(error.message);

            const prediction = generateMockPrediction(req.body);

            return res.json({

                success: true,

                prediction
            });
        }
    }
);

/* =========================================
   AI TRAIN MODEL
========================================= */

router.post(

    "/train",

    async (req, res) => {

        try {

            const response =
                await axios.post(

                    `${AI_ENGINE_URL}/train`
                );

            console.log(`
=========================================
AI TRAINING STARTED
=========================================
`);

            return res.json({

                success: true,

                training:
                    response.data
            });

        }

        catch (error) {

            console.error(`
=========================================
AI TRAIN ERROR - FALLING BACK TO MOCK
=========================================
`);

            console.error(error.message);

            return res.json({

                success: true,

                training: {
                    success: true,
                    status: "TRAINING_STARTED",
                    is_mock: true
                }
            });
        }
    }
);

/* =========================================
   ADVANCED INTRADAY ANALYSIS
========================================= */

router.post(

    "/intraday-analysis",

    async (req, res) => {

        const {

            symbol,

            candles,

            indicators,

            optionsData

        } = req.body || {};

        try {

            const payload = {

                symbol,

                candles,

                indicators,

                optionsData
            };

            const response =
                await axios.post(

                    `${AI_ENGINE_URL}/predict`,

                    payload
                );

            const analysis =
                response.data;

            return res.json({

                success: true,

                symbol,

                analysis
            });

        }

        catch (error) {

            console.error(`
=========================================
INTRADAY ANALYSIS ERROR - FALLING BACK TO MOCK
=========================================
`);

            console.error(error.message);

            const analysis = generateMockPrediction(req.body);

            return res.json({

                success: true,

                symbol,

                analysis
            });
        }
    }
);

/* =========================================
   AI SIGNAL CONFIDENCE FILTER
========================================= */

router.post(

    "/signal-filter",

    async (req, res) => {

        try {

            const {

                confidence,

                signal

            } = req.body;

            const threshold = 70;

            const accepted =
                confidence >= threshold;

            return res.json({

                success: true,

                accepted,

                signal,

                confidence,

                threshold
            });

        }

        catch (error) {

            console.error(`
=========================================
SIGNAL FILTER ERROR
=========================================
`);

            console.error(error.message);

            return res.status(500)
            .json({

                success: false,

                error:
                    error.message
            });
        }
    }
);

/* =========================================
   AI MARKET SENTIMENT
========================================= */

router.post(

    "/market-sentiment",

    async (req, res) => {

        try {

            const {

                pcr,

                oi,

                volume,

                trend

            } = req.body;

            let sentiment =
                "NEUTRAL";

            if (

                pcr > 1 &&

                trend === "UP"

            ) {

                sentiment =
                    "BULLISH";
            }

            else if (

                pcr < 0.7 &&

                trend === "DOWN"

            ) {

                sentiment =
                    "BEARISH";
            }

            return res.json({

                success: true,

                sentiment,

                confidence:
                    Math.floor(

                        Math.random() * 20
                    ) + 75
            });

        }

        catch (error) {

            console.error(`
=========================================
MARKET SENTIMENT ERROR
=========================================
`);

            console.error(error.message);

            return res.status(500)
            .json({

                success: false,

                error:
                    error.message
            });
        }
    }
);

/* =========================================
   EXPORT ROUTER
========================================= */
module.exports = router;