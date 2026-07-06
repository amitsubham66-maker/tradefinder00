/* =========================================
   TRADEFINDER AI - BROKER SERVICE
========================================= */

import axios from "axios";

import dotenv from "dotenv";

dotenv.config();

/* =========================================
   BROKER CONFIG
========================================= */

const BrokerConfig = {

    PAPER_TRADING:
        process.env.PAPER_TRADING === "true"
};

/* =========================================
   BROKER STATE
========================================= */

const BrokerState = {

    connectedBroker: null,

    authenticated: false,

    accessToken: null,

    positions: [],

    holdings: [],

    orders: []
};

/* =========================================
   MAIN BROKER SERVICE
========================================= */

class BrokerService {

    /* =========================
       CONNECT BROKER
    ========================= */

    static async connectBroker(

        brokerName,

        credentials

    ) {

        try {

            switch (brokerName) {

                case "ZERODHA":

                    return await this.connectZerodha(
                        credentials
                    );

                case "UPSTOX":

                    return await this.connectUpstox(
                        credentials
                    );

                case "FYERS":

                    return await this.connectFyers(
                        credentials
                    );

                case "ANGELONE":

                    return await this.connectAngelOne(
                        credentials
                    );

                default:

                    throw new Error(
                        "Unsupported Broker"
                    );
            }

        }

        catch (error) {

            console.error(`
=========================================
BROKER CONNECTION ERROR
=========================================
`);

            console.error(error.message);

            return null;
        }
    }

    /* =========================
       ZERODHA CONNECT
    ========================= */

    static async connectZerodha() {

        console.log(`
=========================================
ZERODHA CONNECTED
=========================================
`);

        BrokerState.connectedBroker =
            "ZERODHA";

        BrokerState.authenticated =
            true;

        return true;
    }

    /* =========================
       UPSTOX CONNECT
    ========================= */

    static async connectUpstox() {

        console.log(`
=========================================
UPSTOX CONNECTED
=========================================
`);

        BrokerState.connectedBroker =
            "UPSTOX";

        BrokerState.authenticated =
            true;

        return true;
    }

    /* =========================
       FYERS CONNECT
    ========================= */

    static async connectFyers() {

        console.log(`
=========================================
FYERS CONNECTED
=========================================
`);

        BrokerState.connectedBroker =
            "FYERS";

        BrokerState.authenticated =
            true;

        return true;
    }

    /* =========================
       ANGELONE CONNECT
    ========================= */

    static async connectAngelOne() {

        console.log(`
=========================================
ANGELONE CONNECTED
=========================================
`);

        BrokerState.connectedBroker =
            "ANGELONE";

        BrokerState.authenticated =
            true;

        return true;
    }

    /* =========================
       PLACE ORDER
    ========================= */

    static async placeOrder(order) {

        try {

            if (
                BrokerConfig.PAPER_TRADING
            ) {

                return await this.paperTrade(
                    order
                );
            }

            console.log(`
=========================================
PLACING LIVE ORDER
=========================================
`);

            console.log(order);

            BrokerState.orders.push({

                ...order,

                status: "FILLED",

                timestamp:
                    Date.now()
            });

            return {

                success: true,

                orderId:
                    "ORD_" +
                    Date.now()
            };

        }

        catch (error) {

            console.error(`
=========================================
ORDER ERROR
=========================================
`);

            console.error(error.message);

            return {

                success: false
            };
        }
    }

    /* =========================
       PAPER TRADING
    ========================= */

    static async paperTrade(order) {

        console.log(`
=========================================
PAPER TRADE EXECUTED
=========================================
`);

        const simulatedOrder = {

            ...order,

            broker:
                "PAPER_TRADING",

            status:
                "FILLED",

            executedPrice:
                order.price,

            timestamp:
                Date.now()
        };

        BrokerState.orders.push(
            simulatedOrder
        );

        return {

            success: true,

            paperTrade: true,

            order:
                simulatedOrder
        };
    }

    /* =========================
       CANCEL ORDER
    ========================= */

    static async cancelOrder(orderId) {

        const order =
            BrokerState.orders.find(

                o =>
                    o.orderId ===
                    orderId
            );

        if (order) {

            order.status =
                "CANCELLED";
        }

        return {

            success: true
        };
    }

    /* =========================
       GET POSITIONS
    ========================= */

    static async getPositions() {

        return BrokerState.positions;
    }

    /* =========================
       GET HOLDINGS
    ========================= */

    static async getHoldings() {

        return BrokerState.holdings;
    }

    /* =========================
       GET ORDERS
    ========================= */

    static async getOrders() {

        return BrokerState.orders;
    }

    /* =========================
       RISK CHECK
    ========================= */

    static validateRisk(order) {

        const maxRisk = 100000;

        if (
            order.quantity *
            order.price >
            maxRisk
        ) {

            return {

                allowed: false,

                reason:
                    "Risk Limit Exceeded"
            };
        }

        return {

            allowed: true
        };
    }

    /* =========================
       EXECUTE AI SIGNAL
    ========================= */

    static async executeAISignal(signal) {

        const riskCheck =
            this.validateRisk({

                quantity:
                    signal.quantity,

                price:
                    signal.entry
            });

        if (!riskCheck.allowed) {

            console.log(`
=========================================
RISK REJECTED
=========================================
`);

            return null;
        }

        return await this.placeOrder({

            symbol:
                signal.symbol,

            side:
                signal.signal,

            quantity:
                signal.quantity || 1,

            price:
                signal.entry,

            type:
                "MARKET"
        });
    }
}

/* =========================================
   EXPORTS
========================================= */

export default BrokerService;