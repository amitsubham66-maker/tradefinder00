/* =========================================
   TRADEFINDER AI - DATABASE ENGINE
========================================= */

import mongoose from "mongoose";

import dotenv from "dotenv";

dotenv.config();

/* =========================================
   DATABASE CONFIG
========================================= */

const DATABASE_CONFIG = {

    maxPoolSize: 50,

    minPoolSize: 10,

    socketTimeoutMS: 45000,

    connectTimeoutMS: 10000,

    serverSelectionTimeoutMS: 5000,

    heartbeatFrequencyMS: 10000,

    family: 4
};

/* =========================================
   DATABASE STATE
========================================= */

const DatabaseState = {

    connected: false,

    reconnectTries: 0,

    maxReconnectTries: 10
};

/* =========================================
   CONNECT DATABASE
========================================= */

export async function connectDatabase() {

    try {

        console.log(`
=========================================
CONNECTING TO MONGODB DATABASE
=========================================
`);

        await mongoose.connect(

            process.env.MONGO_URI,

            DATABASE_CONFIG
        );

        DatabaseState.connected = true;

        DatabaseState.reconnectTries = 0;

        console.log(`
=========================================
MONGODB CONNECTED SUCCESSFULLY
=========================================
`);

    }

    catch (error) {

        DatabaseState.connected = false;

        console.error(`
=========================================
DATABASE CONNECTION ERROR
=========================================
`);

        console.error(error);

        reconnectDatabase();
    }
}

/* =========================================
   RECONNECT DATABASE
========================================= */

async function reconnectDatabase() {

    if (

        DatabaseState.reconnectTries >=

        DatabaseState.maxReconnectTries

    ) {

        console.error(`
=========================================
MAX DATABASE RECONNECT TRIES REACHED
=========================================
`);

        process.exit(1);
    }

    DatabaseState.reconnectTries++;

    console.log(`
=========================================
RECONNECTING DATABASE...
TRY:
${DatabaseState.reconnectTries}
=========================================
`);

    setTimeout(async () => {

        await connectDatabase();

    }, 5000);
}

/* =========================================
   DATABASE EVENTS
========================================= */

mongoose.connection.on(

    "connected",

    () => {

        console.log(`
=========================================
DATABASE EVENT: CONNECTED
=========================================
`);
    }
);

mongoose.connection.on(

    "error",

    error => {

        console.error(`
=========================================
DATABASE EVENT: ERROR
=========================================
`);

        console.error(error);
    }
);

mongoose.connection.on(

    "disconnected",

    () => {

        console.log(`
=========================================
DATABASE EVENT: DISCONNECTED
=========================================
`);

        DatabaseState.connected = false;

        reconnectDatabase();
    }
);

/* =========================================
   DATABASE HEALTH CHECK
========================================= */

export async function checkDatabaseHealth() {

    try {

        const state =
            mongoose.connection.readyState;

        const healthMap = {

            0: "DISCONNECTED",

            1: "CONNECTED",

            2: "CONNECTING",

            3: "DISCONNECTING"
        };

        return {

            status:
                healthMap[state],

            connected:
                DatabaseState.connected,

            reconnectAttempts:
                DatabaseState.reconnectTries,

            timestamp:
                new Date()
        };

    }

    catch (error) {

        return {

            status: "ERROR",

            error: error.message
        };
    }
}

/* =========================================
   CLOSE DATABASE CONNECTION
========================================= */

export async function closeDatabase() {

    try {

        await mongoose.connection.close();

        console.log(`
=========================================
DATABASE CONNECTION CLOSED
=========================================
`);

    }

    catch (error) {

        console.error(`
=========================================
DATABASE CLOSE ERROR
=========================================
`);

        console.error(error);
    }
}

/* =========================================
   GRACEFUL SHUTDOWN
========================================= */

process.on(

    "SIGINT",

    async () => {

        console.log(`
=========================================
GRACEFUL SHUTDOWN INITIATED
=========================================
`);

        await closeDatabase();

        process.exit(0);
    }
);

/* =========================================
   EXPORTS
========================================= */

export default {

    connectDatabase,

    checkDatabaseHealth,

    closeDatabase
};