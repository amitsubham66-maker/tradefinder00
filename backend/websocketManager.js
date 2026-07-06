/* =========================================
   TRADEFINDER AI - WEBSOCKET MANAGER
========================================= */

import { Server } from "socket.io";

import {

    subscribeChannel,

    publishMessage

} from "../redis.js";

/* =========================================
   SOCKET STATE
========================================= */

const SocketState = {

    connectedUsers: new Map(),

    activeRooms: new Set(),

    totalConnections: 0
};

/* =========================================
   SOCKET INIT
========================================= */

let io;

/* =========================================
   INITIALIZE SOCKET SERVER
========================================= */

export function initializeWebSocket(server) {

    io = new Server(server, {

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
WEBSOCKET SERVER INITIALIZED
=========================================
`);

    /* =========================
       CONNECTION EVENT
    ========================= */

    io.on(

        "connection",

        socket => {

            console.log(`
=========================================
NEW SOCKET CONNECTED
=========================================
`);

            console.log(socket.id);

            SocketState.totalConnections++;

            /* =====================
               USER REGISTER
            ===================== */

            socket.on(

                "register-user",

                userId => {

                    SocketState.connectedUsers.set(

                        userId,

                        socket.id
                    );

                    socket.join(

                        `user:${userId}`
                    );

                    console.log(`
=========================================
USER REGISTERED
=========================================
`);

                    console.log(userId);
                }
            );

            /* =====================
               JOIN MARKET ROOM
            ===================== */

            socket.on(

                "join-market",

                symbol => {

                    socket.join(

                        `market:${symbol}`
                    );

                    SocketState.activeRooms.add(
                        symbol
                    );

                    console.log(`
=========================================
JOINED MARKET ROOM
=========================================
`);

                    console.log(symbol);
                }
            );

            /* =====================
               LEAVE MARKET ROOM
            ===================== */

            socket.on(

                "leave-market",

                symbol => {

                    socket.leave(

                        `market:${symbol}`
                    );

                    console.log(`
=========================================
LEFT MARKET ROOM
=========================================
`);

                    console.log(symbol);
                }
            );

            /* =====================
               HEARTBEAT
            ===================== */

            socket.on(

                "heartbeat",

                () => {

                    socket.emit(

                        "heartbeat-response",

                        {

                            status:
                                "alive",

                            timestamp:
                                Date.now()
                        }
                    );
                }
            );

            /* =====================
               DISCONNECT
            ===================== */

            socket.on(

                "disconnect",

                () => {

                    console.log(`
=========================================
SOCKET DISCONNECTED
=========================================
`);

                    SocketState.connectedUsers
                    .forEach(

                        (

                            socketId,

                            userId

                        ) => {

                            if (
                                socketId ===
                                socket.id
                            ) {

                                SocketState
                                .connectedUsers
                                .delete(userId);
                            }
                        }
                    );
                }
            );
        }
    );

    /* =========================
       REDIS SUBSCRIPTIONS
    ========================= */

    initializeRedisChannels();

    return io;
}

/* =========================================
   REDIS CHANNELS
========================================= */

function initializeRedisChannels() {

    /* =========================
       MARKET DATA CHANNEL
    ========================= */

    subscribeChannel(

        "market-data",

        data => {

            io.emit(

                "market-update",

                data
            );
        }
    );

    /* =========================
       AI SIGNAL CHANNEL
    ========================= */

    subscribeChannel(

        "ai-signals",

        signal => {

            io.emit(

                "ai-signal",

                signal
            );
        }
    );

    /* =========================
       OPTION CHAIN CHANNEL
    ========================= */

    subscribeChannel(

        "option-chain",

        options => {

            io.emit(

                "option-update",

                options
            );
        }
    );

    /* =========================
       ORDER UPDATE CHANNEL
    ========================= */

    subscribeChannel(

        "order-updates",

        order => {

            io.to(

                `user:${order.userId}`
            )

            .emit(

                "order-update",

                order
            );
        }
    );

    console.log(`
=========================================
REDIS CHANNELS SUBSCRIBED
=========================================
`);
}

/* =========================================
   BROADCAST MARKET DATA
========================================= */

export async function broadcastMarketData(

    symbol,

    data

) {

    try {

        io.to(

            `market:${symbol}`
        )

        .emit(

            "market-update",

            {

                symbol,

                data,

                timestamp:
                    Date.now()
            }
        );

        await publishMessage(

            "market-data",

            {

                symbol,

                data
            }
        );

    }

    catch (error) {

        console.error(`
=========================================
MARKET BROADCAST ERROR
=========================================
`);

        console.error(error.message);
    }
}

/* =========================================
   BROADCAST AI SIGNAL
========================================= */

export async function broadcastAISignal(

    signal

) {

    try {

        io.emit(

            "ai-signal",

            signal
        );

        await publishMessage(

            "ai-signals",

            signal
        );

    }

    catch (error) {

        console.error(`
=========================================
AI SIGNAL ERROR
=========================================
`);

        console.error(error.message);
    }
}

/* =========================================
   BROADCAST OPTION CHAIN
========================================= */

export async function broadcastOptionChain(

    data

) {

    try {

        io.emit(

            "option-update",

            data
        );

        await publishMessage(

            "option-chain",

            data
        );

    }

    catch (error) {

        console.error(`
=========================================
OPTION CHAIN ERROR
=========================================
`);

        console.error(error.message);
    }
}

/* =========================================
   SEND USER NOTIFICATION
========================================= */

export function sendUserNotification(

    userId,

    notification

) {

    try {

        io.to(

            `user:${userId}`
        )

        .emit(

            "notification",

            notification
        );

    }

    catch (error) {

        console.error(`
=========================================
NOTIFICATION ERROR
=========================================
`);

        console.error(error.message);
    }
}

/* =========================================
   GET SOCKET STATS
========================================= */

export function getSocketStats() {

    return {

        totalConnections:

            SocketState
            .totalConnections,

        activeUsers:

            SocketState
            .connectedUsers.size,

        activeRooms:

            SocketState
            .activeRooms.size
    };
}

/* =========================================
   EXPORT SOCKET
========================================= */

export {

    io
};