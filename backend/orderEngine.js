/* =========================================
   TRADEFINDER AI - ORDER ENGINE
========================================= */

import BrokerService from "../services/brokerService.js";

/* =========================================
   ORDER STATE
========================================= */

const OrderState = {

    activeTrades: [],

    completedTrades: [],

    rejectedTrades: [],

    totalPnL: 0
};

/* =========================================
   ORDER ENGINE
========================================= */

class OrderEngine {

    /* =========================
       PROCESS AI SIGNAL
    ========================= */

    static async processSignal(signal) {

        try {

            console.log(`
=========================================
PROCESSING AI SIGNAL
=========================================
`);

            console.log(signal);

            /* =====================
               VALIDATE SIGNAL
            ===================== */

            const validation =
                this.validateSignal(signal);

            if (!validation.valid) {

                return this.rejectTrade(

                    signal,

                    validation.reason
                );
            }

            /* =====================
               POSITION SIZE
            ===================== */

            const quantity =
                this.calculatePositionSize(
                    signal
                );

            /* =====================
               CREATE ORDER
            ===================== */

            const order = {

                symbol:
                    signal.symbol,

                side:
                    signal.signal,

                quantity,

                price:
                    signal.entry,

                stoploss:
                    signal.stoploss,

                target:
                    signal.target,

                confidence:
                    signal.confidence,

                type:
                    "MARKET",

                timestamp:
                    Date.now()
            };

            /* =====================
               EXECUTE ORDER
            ===================== */

            const execution =
                await BrokerService
                .placeOrder(order);

            if (!execution.success) {

                return this.rejectTrade(

                    signal,

                    "Execution Failed"
                );
            }

            /* =====================
               STORE ACTIVE TRADE
            ===================== */

            OrderState.activeTrades
            .push({

                ...order,

                status: "ACTIVE",

                orderId:
                    execution.orderId ||
                    Date.now()
            });

            console.log(`
=========================================
TRADE EXECUTED SUCCESSFULLY
=========================================
`);

            return {

                success: true,

                order
            };

        }

        catch (error) {

            console.error(`
=========================================
ORDER ENGINE ERROR
=========================================
`);

            console.error(error.message);

            return {

                success: false
            };
        }
    }

    /* =========================
       VALIDATE SIGNAL
    ========================= */

    static validateSignal(signal) {

        if (!signal.symbol) {

            return {

                valid: false,

                reason:
                    "Invalid Symbol"
            };
        }

        if (
            signal.confidence < 70
        ) {

            return {

                valid: false,

                reason:
                    "Low AI Confidence"
            };
        }

        return {

            valid: true
        };
    }

    /* =========================
       POSITION SIZE
    ========================= */

    static calculatePositionSize(signal) {

        const capital = 100000;

        const riskPerTrade = 0.01;

        const riskAmount =
            capital * riskPerTrade;

        const stopDistance =

            Math.abs(

                signal.entry -

                signal.stoploss
            );

        const quantity =

            Math.floor(

                riskAmount /

                stopDistance
            );

        return quantity > 0
            ? quantity
            : 1;
    }

    /* =========================
       REJECT TRADE
    ========================= */

    static rejectTrade(

        signal,

        reason

    ) {

        OrderState.rejectedTrades
        .push({

            signal,

            reason,

            timestamp:
                Date.now()
        });

        console.log(`
=========================================
TRADE REJECTED
=========================================
`);

        console.log(reason);

        return {

            success: false,

            reason
        };
    }

    /* =========================
       UPDATE ACTIVE TRADES
    ========================= */

    static async updateTrades(

        marketPriceMap

    ) {

        for (

            const trade of
            OrderState.activeTrades

        ) {

            const currentPrice =

                marketPriceMap[
                    trade.symbol
                ];

            if (!currentPrice)
                continue;

            /* =====================
               TARGET HIT
            ===================== */

            if (

                trade.side === "BUY" &&

                currentPrice >=
                trade.target

            ) {

                await this.closeTrade(

                    trade,

                    currentPrice,

                    "TARGET HIT"
                );
            }

            /* =====================
               STOPLOSS HIT
            ===================== */

            if (

                trade.side === "BUY" &&

                currentPrice <=
                trade.stoploss

            ) {

                await this.closeTrade(

                    trade,

                    currentPrice,

                    "STOPLOSS HIT"
                );
            }
        }
    }

    /* =========================
       CLOSE TRADE
    ========================= */

    static async closeTrade(

        trade,

        exitPrice,

        reason

    ) {

        trade.status = "CLOSED";

        trade.exitPrice = exitPrice;

        trade.exitReason = reason;

        trade.exitTimestamp =
            Date.now();

        const pnl =

            (exitPrice -
            trade.price)

            * trade.quantity;

        trade.pnl = pnl;

        OrderState.totalPnL += pnl;

        OrderState.completedTrades
        .push(trade);

        OrderState.activeTrades =

            OrderState.activeTrades
            .filter(

                t =>
                    t.orderId !==
                    trade.orderId
            );

        console.log(`
=========================================
TRADE CLOSED
=========================================
`);

        console.log({

            symbol:
                trade.symbol,

            pnl
        });
    }

    /* =========================
       GET ACTIVE TRADES
    ========================= */

    static getActiveTrades() {

        return OrderState
        .activeTrades;
    }

    /* =========================
       GET COMPLETED TRADES
    ========================= */

    static getCompletedTrades() {

        return OrderState
        .completedTrades;
    }

    /* =========================
       GET TOTAL PNL
    ========================= */

    static getTotalPnL() {

        return OrderState.totalPnL;
    }
}

/* =========================================
   EXPORTS
========================================= */

export default OrderEngine;