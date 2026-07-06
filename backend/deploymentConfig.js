/* =========================================
   TRADEFINDER AI - DEPLOYMENT CONFIG
========================================= */

import dotenv from "dotenv";

dotenv.config();

/* =========================================
   ENVIRONMENT
========================================= */

const ENV = process.env.NODE_ENV || "development";

/* =========================================
   DEPLOYMENT CONFIG
========================================= */

const DeploymentConfig = {

    /* =====================================
       APP CONFIG
    ===================================== */

    app: {

        name:
            "TradeFinder AI",

        env:
            ENV,

        port:
            process.env.PORT || 5000,

        frontendURL:
            process.env.FRONTEND_URL ||

            "http://localhost:3000"
    },

    /* =====================================
       DATABASE CONFIG
    ===================================== */

    database: {

        mongoURI:
            process.env.MONGO_URI,

        poolSize: 20,

        socketTimeoutMS: 45000,

        connectTimeoutMS: 30000,

        retryWrites: true
    },

    /* =====================================
       REDIS CONFIG
    ===================================== */

    redis: {

        host:
            process.env.REDIS_HOST || "127.0.0.1",

        port:
            process.env.REDIS_PORT || 6379,

        password:
            process.env.REDIS_PASSWORD || ""
    },

    /* =====================================
       JWT CONFIG
    ===================================== */

    jwt: {

        secret:
            process.env.JWT_SECRET,

        expiresIn: "7d"
    },

    /* =====================================
       API CONFIG
    ===================================== */

    api: {

        timeout: 10000,

        retries: 3,

        rateLimit: 100
    },

    /* =====================================
       WEBSOCKET CONFIG
    ===================================== */

    websocket: {

        pingInterval: 25000,

        pingTimeout: 60000,

        reconnectAttempts: 10
    },

    /* =====================================
       AI CONFIG
    ===================================== */

    ai: {

        modelVersion:
            "TRADEFINDER_AI_V1",

        learningRate: 0.01,

        retrainingInterval: "6h",

        gpuEnabled: false
    },

    /* =====================================
       NSE CONFIG
    ===================================== */

    nse: {

        baseURL:
            "https://www.nseindia.com",

        requestDelay: 1500,

        maxRetries: 5
    },

    /* =====================================
       SECURITY CONFIG
    ===================================== */

    security: {

        corsOrigins: [

            "http://localhost:3000",

            process.env.FRONTEND_URL
        ],

        sslEnabled:
            ENV === "production",

        trustedProxies: true
    },

    /* =====================================
       LOGGING CONFIG
    ===================================== */

    logging: {

        level:

            ENV === "production"

            ?

            "error"

            :

            "debug",

        rotateSize:
            10 * 1024 * 1024
    },

    /* =====================================
       MARKET CONFIG
    ===================================== */

    market: {

        timezone:
            "Asia/Kolkata",

        marketOpen:
            "09:15",

        marketClose:
            "15:30"
    }
};

/* =========================================
   EXPORT
========================================= */

export default DeploymentConfig;