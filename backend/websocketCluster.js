/* =========================================
   TRADEFINDER AI - WEBSOCKET CLUSTER
========================================= */

import { Server } from "socket.io";

import RedisService, {

    redisSubscriber

} from "../services/redisService.js";

import LoggingService from "../services/loggingService.js";

/* =========================================
   SOCKET STATE
========================================= */

const ConnectedClients = new Map();

/* =========================================
   WEBSOCKET CLUSTER
========================================= */

class WebsocketCluster {

    static io = null;

    /* =====================================
       INITIALIZE SOCKET SERVER
    ===================================== */

    static initialize(server) {

        try {

            this.io = new Server(server, {

                cors: {

                    origin: "*",

                    methods: [

                        "GET",

                        "POST"
                    ]
                },

                transports: [

                    "websocket"
                ]
            });

            console.log(`
=========================================
WEBSOCKET CLUSTER INITIALIZED
=========================================
`);

            /* =============================
               SOCKET CONNECTION
            ============================= */

            this.io.on(

                "connection",

                socket => {

                    console.log(`
=========================================
CLIENT CONNECTED
=========================================
`);

                    console.log(
                        `SOCKET ID: ${socket.id}`
                    );

                    /* =====================
                       STORE CLIENT
                    ===================== */

                    ConnectedClients.set(

                        socket.id,

                        {

                            socket,

                            connectedAt:
                                new Date()
                        }
                    );

                    /* =====================
                       USER SUBSCRIPTIONS
                    ===================== */

                    socket.on(

                        "subscribe",

                        channel => {

                            socket.join(channel);

                            console.log(
                                `SUBSCRIBED: ${channel}`
                            );
                        }
                    );

                    /* =====================
                       UNSUBSCRIBE
                    ===================== */

                    socket.on(

                        "unsubscribe",

                        channel => {

                            socket.leave(channel);

                            console.log(
                                `UNSUBSCRIBED: ${channel}`
                            );
                        }
                    );

                    /* =====================
                       DISCONNECT
                    ===================== */

                    socket.on(

                        "disconnect",

                        () => {

                            ConnectedClients.delete(
                                socket.id
                            );

                            console.log(`
=========================================
CLIENT DISCONNECTED
=========================================
`);
                        }
                    );
                }
            );

            /* =============================
               REDIS CHANNEL LISTENERS
            ============================= */

            this.initializeRedisChannels();

        }

        catch (error) {

            LoggingService.logError(

                "WEBSOCKET_INITIALIZE",

                error
            );
        }
    }

    /* =====================================
       REDIS CHANNELS
    ===================================== */

    static async initializeRedisChannels() {

        try {

            const channels = [

                "MARKET_DATA",

                "AI_SIGNALS",

                "TRADE_UPDATES",

                "PORTFOLIO_UPDATES",

                "RISK_ALERTS"
            ];

            for (

                const channel of channels

            ) {

                await RedisService.subscribe(

                    channel,

                    message => {

                        this.broadcast(

                            channel,

                            message
                        );
                    }
                );
            }

            console.log(`
=========================================
REDIS CHANNELS INITIALIZED
=========================================
`);

        }

        catch (error) {

            LoggingService.logError(

                "REDIS_CHANNELS",

                error
            );
        }
    }

    /* =====================================
       BROADCAST EVENT
    ===================================== */

    static broadcast(

        channel,

        data

    ) {

        try {

            if (!this.io) {

                return;
            }

            this.io.to(channel).emit(

                channel,

                {

                    timestamp:
                        new Date(),

                    data
                }
            );

        }

        catch (error) {

            LoggingService.logError(

                "SOCKET_BROADCAST",

                error
            );
        }
    }

    /* =====================================
       PUBLISH MARKET DATA
    ===================================== */

    static async publishMarketData(

        marketData

    ) {

        try {

            await RedisService.publish(

                "MARKET_DATA",

                marketData
            );

        }

        catch (error) {

            LoggingService.logError(

                "PUBLISH_MARKET_DATA",

                error
            );
        }
    }

    /* =====================================
       PUBLISH AI SIGNAL
    ===================================== */

    static async publishAISignal(

        signal

    ) {

        try {

            await RedisService.publish(

                "AI_SIGNALS",

                signal
            );

        }

        catch (error) {

            LoggingService.logError(

                "PUBLISH_AI_SIGNAL",

                error
            );
        }
    }

    /* =====================================
       PUBLISH TRADE UPDATE
    ===================================== */

    static async publishTradeUpdate(

        trade

    ) {

        try {

            await RedisService.publish(

                "TRADE_UPDATES",

                trade
            );

        }

        catch (error) {

            LoggingService.logError(

                "PUBLISH_TRADE_UPDATE",

                error
            );
        }
    }

    /* =====================================
       PUBLISH PORTFOLIO UPDATE
    ===================================== */

    static async publishPortfolioUpdate(

        portfolio

    ) {

        try {

            await RedisService.publish(

                "PORTFOLIO_UPDATES",

                portfolio
            );

        }

        catch (error) {

            LoggingService.logError(

                "PUBLISH_PORTFOLIO",

                error
            );
        }
    }

    /* =====================================
       PUBLISH RISK ALERT
    ===================================== */

    static async publishRiskAlert(

        alert

    ) {

        try {

            await RedisService.publish(

                "RISK_ALERTS",

                alert
            );

        }

        catch (error) {

            LoggingService.logError(

                "PUBLISH_RISK_ALERT",

                error
            );
        }
    }

    /* =====================================
       SEND TO SPECIFIC USER
    ===================================== */

    static sendToUser(

        socketId,

        event,

        payload

    ) {

        try {

            if (

                ConnectedClients.has(
                    socketId
                )

            ) {

                const client =
                    ConnectedClients.get(
                        socketId
                    );

                client.socket.emit(

                    event,

                    payload
                );
            }

        }

        catch (error) {

            LoggingService.logError(

                "SEND_TO_USER",

                error
            );
        }
    }

    /* =====================================
       GET ACTIVE CLIENTS
    ===================================== */

    static getActiveClients() {

        return {

            total:
                ConnectedClients.size,

            clients:

                Array.from(

                    ConnectedClients.keys()
                )
        };
    }

    /* =====================================
       SYSTEM STATS
    ===================================== */

    static getSystemStats() {

        return {

            activeClients:
                ConnectedClients.size,

            websocketActive:
                this.io !== null,

            timestamp:
                new Date()
        };
    }
}

/* =========================================
   EXPORT
========================================= */

export default WebsocketCluster;