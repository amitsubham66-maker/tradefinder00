/* =========================================
   TRADEFINDER AI - TRADE MODEL
========================================= */

import mongoose from "mongoose";

/* =========================================
   TRADE SCHEMA
========================================= */

const TradeSchema = new mongoose.Schema(

    {

        /* =====================
           USER INFO
        ===================== */

        userId: {

            type:
                mongoose.Schema.Types.ObjectId,

            ref: "User",

            required: true
        },

        /* =====================
           TRADE INFO
        ===================== */

        symbol: {

            type: String,

            required: true
        },

        side: {

            type: String,

            enum: [

                "BUY",

                "SELL"
            ],

            required: true
        },

        quantity: {

            type: Number,

            required: true
        },

        orderType: {

            type: String,

            enum: [

                "MARKET",

                "LIMIT",

                "SL",

                "SL-M"
            ],

            default: "MARKET"
        },

        /* =====================
           PRICES
        ===================== */

        entryPrice: {

            type: Number,

            required: true
        },

        exitPrice: {

            type: Number,

            default: 0
        },

        stoploss: {

            type: Number
        },

        target: {

            type: Number
        },

        /* =====================
           PNL
        ===================== */

        pnl: {

            type: Number,

            default: 0
        },

        roi: {

            type: Number,

            default: 0
        },

        /* =====================
           TRADE STATUS
        ===================== */

        status: {

            type: String,

            enum: [

                "OPEN",

                "CLOSED",

                "CANCELLED",

                "REJECTED"
            ],

            default: "OPEN"
        },

        exitReason: {

            type: String,

            default: ""
        },

        /* =====================
           AI SIGNAL DATA
        ===================== */

        aiSignal: {

            signal: {

                type: String,

                enum: [

                    "BULLISH",

                    "BEARISH",

                    "SIDEWAYS"
                ]
            },

            confidence: {

                type: Number
            },

            strategy: {

                type: String
            },

            aiModel: {

                type: String,

                default: "LSTM"
            }
        },

        /* =====================
           RISK ANALYTICS
        ===================== */

        riskRewardRatio: {

            type: Number,

            default: 0
        },

        maxDrawdown: {

            type: Number,

            default: 0
        },

        /* =====================
           EXECUTION DATA
        ===================== */

        broker: {

            type: String,

            default: "PAPER_TRADING"
        },

        orderId: {

            type: String
        },

        executionLatency: {

            type: Number
        },

        /* =====================
           MARKET DATA SNAPSHOT
        ===================== */

        marketSnapshot: {

            vwap: Number,

            rsi: Number,

            macd: Number,

            volume: Number,

            oi: Number,

            pcr: Number
        },

        /* =====================
           TIMESTAMPS
        ===================== */

        entryTime: {

            type: Date,

            default: Date.now
        },

        exitTime: {

            type: Date
        }
    },

    {

        timestamps: true
    }
);

/* =========================================
   INDEXES
========================================= */

TradeSchema.index({

    userId: 1
});

TradeSchema.index({

    symbol: 1
});

TradeSchema.index({

    status: 1
});

TradeSchema.index({

    entryTime: -1
});

/* =========================================
   EXPORT MODEL
========================================= */

const Trade = mongoose.model(

    "Trade",

    TradeSchema
);

export default Trade;