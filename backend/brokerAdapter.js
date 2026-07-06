/* =========================================
   TRADEFINDER AI - BROKER ADAPTER
========================================= */

import LoggingService from "../services/loggingService.js";

/* =========================================
   BROKER REGISTRY
========================================= */

const BrokerRegistry = new Map();

/* =========================================
   BROKER ADAPTER
========================================= */

class BrokerAdapter {

    /* =====================================
       REGISTER BROKER
    ===================================== */

    static registerBroker(

        brokerName,

        brokerInstance

    ) {

        try {

            BrokerRegistry.set(

                brokerName,

                {

                    instance:
                        brokerInstance,

                    status:
                        "ACTIVE",

                    lastHeartbeat:
                        new Date(),

                    latency: 0
                }
            );

            console.log(`
=========================================
BROKER REGISTERED
=========================================
`);

            console.log(
                `BROKER: ${brokerName}`
            );

        }

        catch (error) {

            LoggingService.logError(

                "REGISTER_BROKER",

                error
            );
        }
    }

    /* =====================================
       GET BROKER
    ===================================== */

    static getBroker(

        brokerName

    ) {

        try {

            if (

                !BrokerRegistry.has(
                    brokerName
                )

            ) {

                throw new Error(
                    "BROKER_NOT_FOUND"
                );
            }

            return BrokerRegistry
                .get(brokerName)
                .instance;

        }

        catch (error) {

            LoggingService.logError(

                "GET_BROKER",

                error
            );

            return null;
        }
    }

    /* =====================================
       EXECUTE ORDER
    ===================================== */

    static async executeOrder(

        brokerName,

        order

    ) {

        try {

            const broker =
                this.getBroker(
                    brokerName
                );

            if (!broker) {

                throw new Error(
                    "INVALID_BROKER"
                );
            }

            const startTime =
                Date.now();

            const response =
                await broker.placeOrder(
                    order
                );

            const latency =
                Date.now() -
                startTime;

            /* =============================
               UPDATE LATENCY
            ============================= */

            BrokerRegistry.get(
                brokerName
            ).latency = latency;

            return {

                success: true,

                broker:
                    brokerName,

                latency,

                response
            };

        }

        catch (error) {

            LoggingService.logError(

                "BROKER_EXECUTION",

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
       FAILOVER EXECUTION
    ===================================== */

    static async failoverExecution(

        order

    ) {

        try {

            const brokers =

                Array.from(
                    BrokerRegistry.entries()
                )

                .filter(

                    ([, broker]) =>

                        broker.status ===
                        "ACTIVE"
                );

            for (

                const [

                    brokerName,

                    brokerData

                ] of brokers

            ) {

                try {

                    const result =
                        await brokerData
                        .instance
                        .placeOrder(order);

                    if (

                        result.success

                    ) {

                        return {

                            success: true,

                            broker:
                                brokerName,

                            result
                        };
                    }

                }

                catch (brokerError) {

                    continue;
                }
            }

            return {

                success: false,

                error:
                    "ALL_BROKERS_FAILED"
            };

        }

        catch (error) {

            LoggingService.logError(

                "FAILOVER_EXECUTION",

                error
            );

            return {

                success: false
            };
        }
    }

    /* =====================================
       GET ACCOUNT BALANCE
    ===================================== */

    static async getBalance(

        brokerName

    ) {

        try {

            const broker =
                this.getBroker(
                    brokerName
                );

            return await broker.getBalance();

        }

        catch (error) {

            LoggingService.logError(

                "GET_BALANCE",

                error
            );

            return null;
        }
    }

    /* =====================================
       GET POSITIONS
    ===================================== */

    static async getPositions(

        brokerName

    ) {

        try {

            const broker =
                this.getBroker(
                    brokerName
                );

            return await broker.getPositions();

        }

        catch (error) {

            LoggingService.logError(

                "GET_POSITIONS",

                error
            );

            return [];
        }
    }

    /* =====================================
       HEALTH CHECK
    ===================================== */

    static async brokerHealthCheck() {

        try {

            const health = [];

            for (

                const [

                    brokerName,

                    brokerData

                ]

                of BrokerRegistry.entries()

            ) {

                try {

                    const start =
                        Date.now();

                    await brokerData
                    .instance
                    .healthCheck();

                    const latency =
                        Date.now() - start;

                    brokerData.status =
                        "ACTIVE";

                    brokerData.latency =
                        latency;

                    brokerData.lastHeartbeat =
                        new Date();

                    health.push({

                        broker:
                            brokerName,

                        status:
                            "ACTIVE",

                        latency
                    });

                }

                catch (error) {

                    brokerData.status =
                        "DOWN";

                    health.push({

                        broker:
                            brokerName,

                        status:
                            "DOWN"
                    });
                }
            }

            return health;

        }

        catch (error) {

            LoggingService.logError(

                "BROKER_HEALTH_CHECK",

                error
            );

            return [];
        }
    }

    /* =====================================
       GET BEST BROKER
    ===================================== */

    static getBestBroker() {

        try {

            const brokers =

                Array.from(
                    BrokerRegistry.entries()
                )

                .filter(

                    ([, broker]) =>

                        broker.status ===
                        "ACTIVE"
                )

                .sort(

                    (

                        [, a],

                        [, b]

                    ) =>

                        a.latency -
                        b.latency
                );

            if (

                brokers.length === 0

            ) {

                return null;
            }

            return brokers[0][0];

        }

        catch (error) {

            LoggingService.logError(

                "BEST_BROKER",

                error
            );

            return null;
        }
    }

    /* =====================================
       GET BROKER STATS
    ===================================== */

    static getBrokerStats() {

        try {

            return Array.from(

                BrokerRegistry.entries()

            ).map(

                ([name, broker]) => ({

                    name,

                    status:
                        broker.status,

                    latency:
                        broker.latency,

                    lastHeartbeat:
                        broker.lastHeartbeat
                })
            );

        }

        catch (error) {

            LoggingService.logError(

                "BROKER_STATS",

                error
            );

            return [];
        }
    }
}

/* =========================================
   EXPORT
========================================= */

export default BrokerAdapter;