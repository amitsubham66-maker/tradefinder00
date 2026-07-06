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

    maxReconnectTries: 3,

    isMock: false,

    reconnecting: false
};

/* =========================================
   MONGOOSE MOCK
========================================= */

function setupMongooseMock() {
    console.log(`
=========================================
SETTING UP MONGOOSE MOCK FALLBACK
=========================================
`);

    const inMemoryDb = {};

    const getStore = (modelName) => {
        if (!inMemoryDb[modelName]) {
            inMemoryDb[modelName] = [];
            if (modelName === "User") {
                inMemoryDb[modelName].push({
                    _id: "60c72b2f9b1d8a3564fcf222",
                    username: "mockuser",
                    email: "mock@example.com",
                    password: "hashedpassword",
                    role: "USER",
                    subscription: "FREE",
                    isBlocked: false,
                    save: async function() { return this; }
                });
            }
        }
        return inMemoryDb[modelName];
    };

    const makeQueryChain = (result) => {
        const chain = Promise.resolve(result);
        const methods = [
            "select", "populate", "sort", "limit", "skip", "lean", "exec",
            "where", "equals", "gt", "lt", "in", "nin", "and", "or", "nor"
        ];
        for (const method of methods) {
            chain[method] = function() { return makeQueryChain(result); };
        }
        return chain;
    };

    mongoose.Model.find = function(query = {}) {
        const store = getStore(this.modelName);
        let results = store;
        if (query && typeof query === "object" && !Array.isArray(query)) {
            results = store.filter(item => {
                for (const key in query) {
                    if (query[key] !== undefined && item[key] !== query[key]) {
                        return false;
                    }
                }
                return true;
            });
        }
        return makeQueryChain(results);
    };

    mongoose.Model.findOne = function(query = {}) {
        const store = getStore(this.modelName);
        let found = store.find(item => {
            if (query && typeof query === "object" && !Array.isArray(query)) {
                for (const key in query) {
                    if (query[key] !== undefined && item[key] !== query[key]) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        });
        return makeQueryChain(found || null);
    };

    mongoose.Model.findById = function(id) {
        const store = getStore(this.modelName);
        let found = store.find(item => String(item._id) === String(id));
        return makeQueryChain(found || null);
    };

    mongoose.Model.create = async function(doc) {
        const store = getStore(this.modelName);
        const docs = Array.isArray(doc) ? doc : [doc];
        const createdDocs = docs.map(d => {
            const newDoc = {
                _id: d._id || new mongoose.Types.ObjectId().toString(),
                ...d,
                createdAt: new Date(),
                updatedAt: new Date(),
                save: async function() { return this; }
            };
            store.push(newDoc);
            return newDoc;
        });
        return Array.isArray(doc) ? createdDocs : createdDocs[0];
    };

    mongoose.Model.prototype.save = async function() {
        const store = getStore(this.constructor.modelName);
        const plainDoc = this.toObject ? this.toObject() : this;
        if (!plainDoc._id) {
            plainDoc._id = new mongoose.Types.ObjectId().toString();
        }
        const index = store.findIndex(item => String(item._id) === String(plainDoc._id));
        if (index !== -1) {
            store[index] = { ...store[index], ...plainDoc, updatedAt: new Date() };
        } else {
            store.push({
                ...plainDoc,
                createdAt: new Date(),
                updatedAt: new Date(),
                save: async function() { return this; }
            });
        }
        return this;
    };

    mongoose.Model.updateOne = function(query, update) {
        return makeQueryChain({ n: 1, nModified: 1, ok: 1 });
    };

    mongoose.Model.updateMany = function(query, update) {
        return makeQueryChain({ n: 1, nModified: 1, ok: 1 });
    };

    mongoose.Model.deleteOne = function(query) {
        return makeQueryChain({ n: 1, deletedCount: 1, ok: 1 });
    };

    mongoose.Model.deleteMany = function(query) {
        return makeQueryChain({ n: 1, deletedCount: 1, ok: 1 });
    };

    mongoose.Model.countDocuments = function(query) {
        const store = getStore(this.modelName);
        return makeQueryChain(store.length);
    };

    try {
        Object.defineProperty(mongoose.connection, "readyState", {
            get: () => 1,
            configurable: true
        });
    } catch (e) {
        console.error("Failed to mock readyState:", e);
    }
}

/* =========================================
   CONNECT DATABASE
========================================= */

export async function connectDatabase() {
    if (DatabaseState.isMock) return;

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

        DatabaseState.reconnecting = false;

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

        await reconnectDatabase();
    }
}

/* =========================================
   RECONNECT DATABASE
========================================= */

async function reconnectDatabase() {
    if (DatabaseState.isMock) return;

    if (DatabaseState.reconnecting) {
        return;
    }
    DatabaseState.reconnecting = true;

    if (

        DatabaseState.reconnectTries >=

        DatabaseState.maxReconnectTries

    ) {

        console.warn(`
=========================================
MAX DATABASE RECONNECT TRIES REACHED.
FALLING BACK TO IN-MEMORY MOCK DATABASE.
=========================================
`);

        setupMongooseMock();

        DatabaseState.connected = true;

        DatabaseState.isMock = true;

        DatabaseState.reconnecting = false;

        return;
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
        try {
            await mongoose.connect(
                process.env.MONGO_URI,
                DATABASE_CONFIG
            );
            DatabaseState.connected = true;
            DatabaseState.reconnectTries = 0;
            DatabaseState.reconnecting = false;
        } catch (e) {
            DatabaseState.reconnecting = false;
            await reconnectDatabase();
        }
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

        if (!DatabaseState.isMock && !DatabaseState.reconnecting) {
            reconnectDatabase();
        }
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
                DatabaseState.isMock ? "MOCK_CONNECTED" : healthMap[state],

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