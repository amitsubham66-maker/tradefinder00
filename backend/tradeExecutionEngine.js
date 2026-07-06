/* =========================================
   TRADEFINDER AI - TRADE EXECUTION ENGINE
========================================= */

import axios from "axios";

import NotificationService from "../services/notificationService.js";

import RiskManager from "../risk/riskManager.js";

/* =========================================
   BROKER CONFIG
========================================= */

const BrokerState = {

    activeBroker: "ZERODHA",

    brokers: {

        ZERODHA: {

            baseURL:
                "https://api.kite.trade",

            apiKey:
                process.env.ZERODHA_API_KEY,

            accessToken:
                process.env.ZERODHA_ACCESS_TOKEN
        },

        ANGELONE: {

            baseURL:
                "https://apiconnect.angelone.in",

            apiKey:
                process.env.ANGELONE_API_KEY,

            accessToken:
                process.env.ANGELONE_ACCESS_TOKEN
        },

        FYERS: {

            baseURL:
                "https://api.fyers.in",

            apiKey:
                process.env.FYERS_API_KEY,

            accessToken:
                process.env.FYERS_ACCESS_TOKEN
        }
    }
};

/* =========================================
   EXECUTION ENGINE
========================================= */

class TradeExecutionEngine {

    /* =====================================
       GET ACTIVE BROKER
    ===================================== */

    static getBroker() {

        return BrokerState.brokers[
            BrokerState.activeBroker
        ];
    }

    /* =====================================
       SWITCH BROKER
    ===================================== */

    static switchBroker(brokerName) {

        try {

            if (

                BrokerState.brokers[
                    brokerName
                ]

            ) {

                BrokerState.activeBroker =
                    brokerName;

                console.log(`
=========================================
BROKER SWITCHED
=========================================
`);

                return true;
            }

            return false;

        }

        catch (error) {

            console.error(`
=========================================
BROKER SWITCH ERROR
=========================================
`);

            return false;
        }
    }

    /* =====================================
       PLACE LIVE ORDER
    ===================================== */

    static async placeOrder(

        userId,

        order

    ) {

        try {

            /* =====================
               RISK VALIDATION
            ===================== */

            const riskCheck =

                RiskManager.validateTrade(

                    {

                        confidence:
                            order.confidence || 80,

                        entry:
                            order.price,

                        stoploss:
                            order.stoploss ||
                            (order.price - 10)
                    },

                    order.capital || 100000
                );

            if (!riskCheck.allowed) {

                return {

                    success: false,

                    reason:
                        riskCheck.reason
                };
            }

            const broker =
                this.getBroker();

            /* =====================
               ORDER PAYLOAD
            ===================== */

            const payload = {

                tradingsymbol:
                    order.symbol,

                exchange:
                    order.exchange || "NSE",

                transaction_type:
                    order.side,

                order_type:
                    order.orderType ||
                    "MARKET",

                quantity:
                    order.quantity,

                product:
                    order.product || "MIS"
            };

            /* =====================
               API CALL
            ===================== */

            const response =
                await axios.post(

                    `${broker.baseURL}/orders`,

                    payload,

                    {

                        headers: {

                            Authorization:

                                `token ${broker.apiKey}:${broker.accessToken}`,

                            "Content-Type":
                                "application/json"
                        }
                    }
                );

            const orderData =
                response.data;

            console.log(`
=========================================
LIVE ORDER EXECUTED
=========================================
`);

            /* =====================
               NOTIFICATION
            ===================== */

            await NotificationService
            .sendOrderAlert(

                userId,

                {

                    symbol:
                        order.symbol,

                    side:
                        order.side,

                    quantity:
                        order.quantity,

                    entryPrice:
                        order.price,

                    status:
                        "EXECUTED"
                }
            );

            return {

                success: true,

                broker:
                    BrokerState.activeBroker,

                orderData
            };

        }

        catch (error) {

            console.error(`
=========================================
LIVE EXECUTION ERROR
=========================================
`);

            console.error(error.message);

            /* =====================
               FAILOVER
            ===================== */

            this.handleBrokerFailure();

            return {

                success: false,

                error:
                    error.message
            };
        }
    }

    /* =====================================
       HANDLE BROKER FAILURE
    ===================================== */

    static handleBrokerFailure() {

        try {

            const brokers =
                Object.keys(
                    BrokerState.brokers
                );

            const currentIndex =
                brokers.indexOf(

                    BrokerState.activeBroker
                );

            const nextBroker =

                brokers[
                    (currentIndex + 1)

                    %

                    brokers.length
                ];

            BrokerState.activeBroker =
                nextBroker;

            console.log(`
=========================================
BROKER FAILOVER ACTIVATED
=========================================
`);

            console.log(
                `ACTIVE BROKER: ${nextBroker}`
            );

        }

        catch (error) {

            console.error(`
=========================================
FAILOVER ERROR
=========================================
`);
        }
    }

    /* =====================================
       MODIFY ORDER
    ===================================== */

    static async modifyOrder(

        orderId,

        modifications

    ) {

        try {

            const broker =
                this.getBroker();

            const response =
                await axios.put(

                    `${broker.baseURL}/orders/${orderId}`,

                    modifications,

                    {

                        headers: {

                            Authorization:

                                `token ${broker.apiKey}:${broker.accessToken}`
                        }
                    }
                );

            console.log(`
=========================================
ORDER MODIFIED
=========================================
`);

            return {

                success: true,

                data:
                    response.data
            };

        }

        catch (error) {

            console.error(`
=========================================
MODIFY ORDER ERROR
=========================================
`);

            return {

                success: false
            };
        }
    }

    /* =====================================
       CANCEL ORDER
    ===================================== */

    static async cancelOrder(orderId) {

        try {

            const broker =
                this.getBroker();

            const response =
                await axios.delete(

                    `${broker.baseURL}/orders/${orderId}`,

                    {

                        headers: {

                            Authorization:

                                `token ${broker.apiKey}:${broker.accessToken}`
                        }
                    }
                );

            console.log(`
=========================================
ORDER CANCELLED
=========================================
`);

            return {

                success: true,

                data:
                    response.data
            };

        }

        catch (error) {

            console.error(`
=========================================
CANCEL ORDER ERROR
=========================================
`);

            return {

                success: false
            };
        }
    }

    /* =====================================
       GET POSITIONS
    ===================================== */

    static async getPositions() {

        try {

            const broker =
                this.getBroker();

            const response =
                await axios.get(

                    `${broker.baseURL}/positions`,

                    {

                        headers: {

                            Authorization:

                                `token ${broker.apiKey}:${broker.accessToken}`
                        }
                    }
                );

            return response.data;

        }

        catch (error) {

            console.error(`
=========================================
GET POSITIONS ERROR
=========================================
`);

            return [];
        }
    }

    /* =====================================
       AUTO EXECUTE AI SIGNAL
    ===================================== */

    static async executeAISignal(

        userId,

        signal

    ) {

        try {

            if (

                signal.confidence < 80

            ) {

                return {

                    success: false,

                    reason:
                        "Low confidence"
                };
            }

            return await this.placeOrder(

                userId,

                {

                    symbol:
                        signal.symbol,

                    side:

                        signal.signal
                        .includes("BUY")

                        ?

                        "BUY"

                        :

                        "SELL",

                    quantity:
                        signal.quantity || 1,

                    price:
                        signal.entry,

                    stoploss:
                        signal.stoploss,

                    confidence:
                        signal.confidence
                }
            );

        }

        catch (error) {

            console.error(`
=========================================
AI EXECUTION ERROR
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

export default TradeExecutionEngine;