/* =========================================
   TRADEFINDER AI - EXECUTION ENGINE
========================================= */

import RedisService from "../services/redisService.js";

import LoggingService from "../services/loggingService.js";

import WebsocketCluster from "../websocket/websocketCluster.js";

/* =========================================
   EXECUTION CONFIG
========================================= */

const ExecutionConfig = {

    MAX_RETRY: 3,

    SLIPPAGE_LIMIT: 0.5,

    EXECUTION_TIMEOUT: 10000
};

/* =========================================
   EXECUTION ENGINE
========================================= */

class ExecutionEngine {

    /* =====================================
       EXECUTE ORDER
    ===================================== */

    static async executeOrder(

        broker,

        order

    ) {

        try {

            console.log(`
=========================================
EXECUTING ORDER
=========================================
`);

            console.log(order);

            /* =============================
               VALIDATION
            ============================= */

            const validation =
                this.validateOrder(order);

            if (!validation.valid) {

                return {

                    success: false,

                    error:
                        validation.error
                };
            }

            /* =============================
               EXECUTE
            ============================= */

            let executionResult = null;

            let retryCount = 0;

            while (

                retryCount <
                ExecutionConfig.MAX_RETRY

            ) {

                try {

                    executionResult =

                        await broker.placeOrder({

                            symbol:
                                order.symbol,

                            side:
                                order.side,

                            quantity:
                                order.quantity,

                            price:
                                order.price,

                            orderType:
                                order.orderType
                        });

                    if (

                        executionResult.success

                    ) {

                        break;
                    }

                }

                catch (retryError) {

                    retryCount++;
                }
            }

            /* =============================
               FAILED EXECUTION
            ============================= */

            if (

                !executionResult ||

                !executionResult.success

            ) {

                await this.handleFailedOrder(
                    order
                );

                return {

                    success: false,

                    error:
                        "EXECUTION_FAILED"
                };
            }

            /* =============================
               SLIPPAGE CHECK
            ============================= */

            const slippage =
                this.calculateSlippage(

                    order.price,

                    executionResult
                    .executedPrice
                );

            /* =============================
               ORDER STATUS
            ============================= */

            const finalOrder = {

                ...order,

                orderId:
                    executionResult
                    .orderId,

                executedPrice:
                    executionResult
                    .executedPrice,

                executedQuantity:
                    executionResult
                    .executedQuantity,

                slippage,

                status:
                    executionResult
                    .status,

                timestamp:
                    new Date()
            };

            /* =============================
               CACHE EXECUTION
            ============================= */

            await RedisService.set(

                `execution:${finalOrder.orderId}`,

                finalOrder,

                86400
            );

            /* =============================
               BROADCAST EXECUTION
            ============================= */

            await WebsocketCluster
            .publishTradeUpdate({

                type:
                    "ORDER_EXECUTED",

                order:
                    finalOrder
            });

            /* =============================
               LOG EXECUTION
            ============================= */

            LoggingService.logTrade({

                symbol:
                    finalOrder.symbol,

                side:
                    finalOrder.side,

                quantity:
                    finalOrder.executedQuantity,

                price:
                    finalOrder.executedPrice
            });

            return {

                success: true,

                order:
                    finalOrder
            };

        }

        catch (error) {

            LoggingService.logError(

                "EXECUTION_ENGINE",

                error
            );

            return {

                success: false,

                error:
                    error.message
            };
        }
    }

    /* =====================================
       VALIDATE ORDER
    ===================================== */

    static validateOrder(order) {

        try {

            if (!order.symbol) {

                return {

                    valid: false,

                    error:
                        "INVALID_SYMBOL"
                };
            }

            if (

                !order.quantity ||

                order.quantity <= 0

            ) {

                return {

                    valid: false,

                    error:
                        "INVALID_QUANTITY"
                };
            }

            if (

                !["BUY", "SELL"]
                .includes(order.side)

            ) {

                return {

                    valid: false,

                    error:
                        "INVALID_SIDE"
                };
            }

            return {

                valid: true
            };

        }

        catch (error) {

            LoggingService.logError(

                "ORDER_VALIDATION",

                error
            );

            return {

                valid: false
            };
        }
    }

    /* =====================================
       SLIPPAGE CALCULATION
    ===================================== */

    static calculateSlippage(

        expectedPrice,

        executedPrice

    ) {

        try {

            const slippage =

                (

                    Math.abs(

                        executedPrice -
                        expectedPrice
                    ) /

                    expectedPrice

                ) * 100;

            return Number(
                slippage.toFixed(2)
            );

        }

        catch (error) {

            LoggingService.logError(

                "SLIPPAGE_CALCULATION",

                error
            );

            return 0;
        }
    }

    /* =====================================
       FAILED ORDER HANDLER
    ===================================== */

    static async handleFailedOrder(

        order

    ) {

        try {

            console.log(`
=========================================
ORDER FAILED
=========================================
`);

            await WebsocketCluster
            .publishTradeUpdate({

                type:
                    "ORDER_FAILED",

                order
            });

        }

        catch (error) {

            LoggingService.logError(

                "FAILED_ORDER_HANDLER",

                error
            );
        }
    }

    /* =====================================
       MONITOR ORDER
    ===================================== */

    static async monitorOrder(

        broker,

        orderId

    ) {

        try {

            const status =
                await broker.getOrderStatus(
                    orderId
                );

            await RedisService.set(

                `order_status:${orderId}`,

                status,

                3600
            );

            return status;

        }

        catch (error) {

            LoggingService.logError(

                "MONITOR_ORDER",

                error
            );

            return null;
        }
    }

    /* =====================================
       CANCEL ORDER
    ===================================== */

    static async cancelOrder(

        broker,

        orderId

    ) {

        try {

            const result =
                await broker.cancelOrder(
                    orderId
                );

            await WebsocketCluster
            .publishTradeUpdate({

                type:
                    "ORDER_CANCELLED",

                orderId
            });

            return result;

        }

        catch (error) {

            LoggingService.logError(

                "CANCEL_ORDER",

                error
            );

            return {

                success: false
            };
        }
    }
}

/* =========================================
   EXPORT
========================================= */

export default ExecutionEngine;