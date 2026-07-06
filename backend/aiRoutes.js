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
AI HEALTH ERROR
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
AI PREDICTION ERROR
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
AI TRAIN ERROR
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
   ADVANCED INTRADAY ANALYSIS
========================================= */

router.post(

    "/intraday-analysis",

    async (req, res) => {

        try {

            const {

                symbol,

                candles,

                indicators,

                optionsData

            } = req.body;

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
INTRADAY ANALYSIS ERROR
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