/* =========================================
   TRADEFINDER AI - PAPER TRADING ENGINE
========================================= */

import NotificationService from "../services/notificationService.js";

import RiskManager from "../risk/riskManager.js";

/* =========================================
   PAPER TRADING STATE
========================================= */

const PaperState = {

    users: new Map()
};

/* =========================================
   PAPER TRADING ENGINE
========================================= */

class PaperTradingEngine {

    /* =====================================
       CREATE PAPER ACCOUNT
    ===================================== */

    static createAccount(

        userId,

        initialBalance = 100000

    ) {

        try {

            if (

                PaperState.users.has(userId)

            ) {

                return PaperState.users.get(
                    userId
                );
            }

            const account = {

                balance:
                    initialBalance,

                initialBalance,

                pnl: 0,

                positions: [],

                trades: [],

                createdAt:
                    new Date()
            };

            PaperState.users.set(

                userId,

                account
            );

            console.log(`
=========================================
PAPER ACCOUNT CREATED
=========================================
`);

            return account;

        }

        catch (error) {

            console.error(`
=========================================
CREATE PAPER ACCOUNT ERROR
=========================================
`);

            return null;
        }
    }

    /* =====================================
       PLACE PAPER ORDER
    ===================================== */

    static async placeOrder(

        userId,

        order

    ) {

        try {

            const account =
                PaperState.users.get(userId);

            if (!account) {

                return {

                    success: false,

                    message:
                        "Paper account not found"
                };
            }

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
                            order.stoploss || (
                                order.price - 10
                            )
                    },

                    account.balance
                );

            if (!riskCheck.allowed) {

                return {

                    success: false,

                    reason:
                        riskCheck.reason
                };
            }

            /* =====================
               CREATE POSITION
            ===================== */

            const position = {

                orderId:

                    `PAPER_${Date.now()}`,

                symbol:
                    order.symbol,

                side:
                    order.side,

                quantity:
                    order.quantity,

                entryPrice:
                    order.price,

                currentPrice:
                    order.price,

                stoploss:
                    order.stoploss,

                target:
                    order.target,

                pnl: 0,

                status:
                    "OPEN",

                createdAt:
                    new Date()
            };

            account.positions.push(
                position
            );

            account.trades.push(
                position
            );

            console.log(`
=========================================
PAPER ORDER EXECUTED
=========================================
`);

            /* =====================
               NOTIFICATION
            ===================== */

            await NotificationService
            .sendRealtimeAlert(

                userId,

                {

                    type:
                        "PAPER_ORDER",

                    position
                }
            );

            return {

                success: true,

                position
            };

        }

        catch (error) {

            console.error(`
=========================================
PAPER ORDER ERROR
=========================================
`);

            console.error(error.message);

            return {

                success: false,

                error:
                    error.message
            };
        }
    }

    /* =====================================
       UPDATE LIVE MARKET PRICE
    ===================================== */

    static async updateMarketPrice(

        symbol,

        livePrice

    ) {

        try {

            for (

                const [

                    userId,

                    account

                ]

                of PaperState.users

            ) {

                account.positions
                .forEach(async position => {

                    if (

                        position.symbol ===
                        symbol &&

                        position.status ===
                        "OPEN"

                    ) {

                        position.currentPrice =
                            livePrice;

                        /* =====================
                           CALCULATE PNL
                        ===================== */

                        if (

                            position.side ===
                            "BUY"

                        ) {

                            position.pnl =

                                (

                                    livePrice -

                                    position.entryPrice

                                )

                                *

                                position.quantity;
                        }

                        else {

                            position.pnl =

                                (

                                    position.entryPrice -

                                    livePrice

                                )

                                *

                                position.quantity;
                        }

                        /* =====================
                           TARGET HIT
                        ===================== */

                        if (

                            position.target &&

                            (

                                (

                                    position.side ===
                                    "BUY" &&

                                    livePrice >=
                                    position.target

                                )

                                ||

                                (

                                    position.side ===
                                    "SELL" &&

                                    livePrice <=
                                    position.target
                                )
                            )
                        ) {

                            await this.closePosition(

                                userId,

                                position.orderId,

                                "TARGET_HIT"
                            );
                        }

                        /* =====================
                           STOPLOSS HIT
                        ===================== */

                        if (

                            position.stoploss &&

                            (

                                (

                                    position.side ===
                                    "BUY" &&

                                    livePrice <=
                                    position.stoploss

                                )

                                ||

                                (

                                    position.side ===
                                    "SELL" &&

                                    livePrice >=
                                    position.stoploss
                                )
                            )
                        ) {

                            await this.closePosition(

                                userId,

                                position.orderId,

                                "STOPLOSS_HIT"
                            );
                        }
                    }
                });

                /* =====================
                   UPDATE ACCOUNT PNL
                ===================== */

                account.pnl =

                    account.positions
                    .reduce(

                        (sum, pos) =>

                            sum + pos.pnl,

                        0
                    );
            }

        }

        catch (error) {

            console.error(`
=========================================
MARKET UPDATE ERROR
=========================================
`);

            console.error(error.message);
        }
    }

    /* =====================================
       CLOSE POSITION
    ===================================== */

    static async closePosition(

        userId,

        orderId,

        reason = "MANUAL"

    ) {

        try {

            const account =
                PaperState.users.get(userId);

            if (!account) {

                return {

                    success: false
                };
            }

            const position =
                account.positions.find(

                    pos =>

                        pos.orderId ===
                        orderId
                );

            if (!position) {

                return {

                    success: false
                };
            }

            position.status =
                "CLOSED";

            position.closedAt =
                new Date();

            position.closeReason =
                reason;

            /* =====================
               UPDATE BALANCE
            ===================== */

            account.balance +=
                position.pnl;

            /* =====================
               REMOVE OPEN POSITION
            ===================== */

            account.positions =

                account.positions.filter(

                    pos =>

                        pos.orderId !==
                        orderId
                );

            console.log(`
=========================================
POSITION CLOSED
=========================================
`);

            /* =====================
               NOTIFICATION
            ===================== */

            await NotificationService
            .sendRealtimeAlert(

                userId,

                {

                    type:
                        "PAPER_POSITION_CLOSED",

                    position
                }
            );

            return {

                success: true,

                position
            };

        }

        catch (error) {

            console.error(`
=========================================
CLOSE POSITION ERROR
=========================================
`);

            console.error(error.message);

            return {

                success: false
            };
        }
    }

    /* =====================================
       GET ACCOUNT
    ===================================== */

    static getAccount(userId) {

        return PaperState.users.get(
            userId
        );
    }

    /* =====================================
       LEADERBOARD
    ===================================== */

    static getLeaderboard() {

        try {

            const leaderboard = [];

            for (

                const [

                    userId,

                    account

                ]

                of PaperState.users

            ) {

                const roi =

                    (

                        (

                            account.balance -

                            account.initialBalance

                        )

                        /

                        account.initialBalance

                    ) * 100;

                leaderboard.push({

                    userId,

                    balance:
                        account.balance,

                    pnl:
                        account.pnl,

                    roi:
                        Number(
                            roi.toFixed(2)
                        )
                });
            }

            return leaderboard.sort(

                (a, b) =>

                    b.roi - a.roi
            );

        }

        catch (error) {

            console.error(`
=========================================
LEADERBOARD ERROR
=========================================
`);

            return [];
        }
    }
}

/* =========================================
   EXPORT
========================================= */

export default PaperTradingEngine;