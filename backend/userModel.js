/* =========================================
   TRADEFINDER AI - USER MODEL
========================================= */

import mongoose from "mongoose";

/* =========================================
   USER SCHEMA
========================================= */

const UserSchema = new mongoose.Schema(

    {

        /* =====================
           BASIC INFO
        ===================== */

        username: {

            type: String,

            required: true,

            unique: true,

            trim: true
        },

        email: {

            type: String,

            required: true,

            unique: true,

            lowercase: true
        },

        password: {

            type: String,

            required: true
        },

        avatar: {

            type: String,

            default: ""
        },

        bio: {

            type: String,

            default: ""
        },

        /* =====================
           SUBSCRIPTION
        ===================== */

        subscription: {

            type: String,

            enum: [

                "FREE",

                "PRO",

                "INSTITUTIONAL"
            ],

            default: "FREE"
        },

        subscriptionExpiry: {

            type: Date
        },

        /* =====================
           BROKER CONNECTIONS
        ===================== */

        brokers: [

            {

                brokerName: {

                    type: String
                },

                accessToken: {

                    type: String
                },

                refreshToken: {

                    type: String
                },

                connectedAt: {

                    type: Date,

                    default: Date.now
                }
            }
        ],

        /* =====================
           TRADING SETTINGS
        ===================== */

        tradingSettings: {

            riskPercentage: {

                type: Number,

                default: 1
            },

            autoTrading: {

                type: Boolean,

                default: false
            },

            paperTrading: {

                type: Boolean,

                default: true
            },

            maxDailyLoss: {

                type: Number,

                default: 5000
            }
        },

        /* =====================
           AI SETTINGS
        ===================== */

        aiPreferences: {

            preferredStrategy: {

                type: String,

                default: "SCALPING"
            },

            indicators: [

                {

                    type: String
                }
            ],

            signalConfidence: {

                type: Number,

                default: 70
            }
        },

        /* =====================
           WATCHLIST
        ===================== */

        watchlist: [

            {

                symbol: String,

                addedAt: {

                    type: Date,

                    default: Date.now
                }
            }
        ],

        /* =====================
           PORTFOLIO
        ===================== */

        portfolio: {

            balance: {

                type: Number,

                default: 100000
            },

            pnl: {

                type: Number,

                default: 0
            }
        },

        /* =====================
           LOGIN SECURITY
        ===================== */

        lastLogin: {

            type: Date
        },

        loginHistory: [

            {

                ip: String,

                device: String,

                timestamp: {

                    type: Date,

                    default: Date.now
                }
            }
        ],

        /* =====================
           ACCOUNT STATUS
        ===================== */

        isVerified: {

            type: Boolean,

            default: false
        },

        isBlocked: {

            type: Boolean,

            default: false
        },

        role: {

            type: String,

            enum: [

                "USER",

                "ADMIN",

                "SUPER_ADMIN"
            ],

            default: "USER"
        }
    },

    {

        timestamps: true
    }
);

/* =========================================
   INDEXES
========================================= */

UserSchema.index({

    email: 1
});

UserSchema.index({

    username: 1
});

/* =========================================
   EXPORT MODEL
========================================= */

const User = mongoose.model(

    "User",

    UserSchema
);

export default User;