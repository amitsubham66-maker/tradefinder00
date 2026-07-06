/* =========================================
   TRADEFINDER AI - MAIN BACKEND SERVER
========================================= */

require("dotenv").config();

/* =========================================
   IMPORTS
========================================= */

const express = require("express");

const http = require("http");

const cors = require("cors");

const helmet = require("helmet");

const compression = require("compression");

const rateLimit = require("express-rate-limit");

const mongoose = require("mongoose");

// const Redis = require("ioredis");

const socketIO = require("socket.io");

const axios = require("axios");

const path = require("path");
/* =========================================
   APP INITIALIZATION
========================================= */

const app = express();

const server = http.createServer(app);

const io = socketIO(server, {

    cors: {

        origin: "*",

        methods: ["GET", "POST"]
    }
});

/* =========================================
   CONFIG
========================================= */

const PORT =
    process.env.PORT || 5000;

const MONGO_URI =
    process.env.MONGO_URI;

const REDIS_URI =
    process.env.REDIS_URI;

/* =========================================
   REDIS
========================================= */

const redis = null;
/* =========================================
   SECURITY
========================================= */

app.use(
    helmet({
        contentSecurityPolicy: false
    })
);

app.use(cors());

app.use(compression());

app.use(express.json());

app.use(express.static(path.join(__dirname, "frontend")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

/* =========================================
   RATE LIMITING
========================================= */

const limiter = rateLimit({

    windowMs:
        1 * 60 * 1000,

    max: 500,

    message:
        "Too many requests"
});

app.use(limiter);

/* =========================================
   DATABASE CONNECTION
========================================= */

const { connectDatabase } = require("./backend/database");
connectDatabase();

/* =========================================
   HEALTH CHECK
========================================= */

app.get("/api", (req, res) => {

    res.json({

        status: "ACTIVE",

        server: "TradeFinder AI",

        ai: "ONLINE",

        websocket: "CONNECTED"
    });
});

/* =========================================
   API ROUTES
========================================= */
app.use(
    "/api/auth",
    require("./backend/authRoutes")
);

app.use(
    "/api/market",
    require("./backend/marketRoutes")
);

app.use(
    "/api/ai",
    require("./backend/aiRoutes")
);

/* =========================================
   WEBSOCKET CONNECTION
========================================= */

io.on("connection", socket => {

    console.log(`
    Client Connected:
    ${socket.id}
    `);

    /* =====================
       SUBSCRIBE STOCK
    ===================== */

    socket.on(
        "subscribe-stock",

        symbol => {

            console.log(
                `
                Subscribe:
                ${symbol}
                `
            );

            socket.join(symbol);
        }
    );

    /* =====================
       UNSUBSCRIBE
    ===================== */

    socket.on(
        "unsubscribe-stock",

        symbol => {

            socket.leave(symbol);
        }
    );

    /* =====================
       DISCONNECT
    ===================== */

    socket.on(
        "disconnect",

        () => {

            console.log(
                `
                Disconnected:
                ${socket.id}
                `
            );
        }
    );
});

/* =========================================
   NSE MARKET STREAM (LIVE DATA)
========================================= */

const NSEService = require("./backend/nseService").default;

class NSEMarketStream {

    static fastBusy = false;
    static slowBusy = false;
    static lastSnapshot = null;

    static async initialize() {

        console.log(`
        =========================================
        NSE LIVE Market Stream Starting
        =========================================
        `);

        try {
            await NSEService.initialize();
        } catch (error) {
            console.error("NSE init error:", error.message);
        }

        this.startStreaming();
    }

    /* =========================
       STREAM LOOPS
       - fast (10s): index quotes for ticker/dashboard
       - slow (30s): stocks, breadth, PCR, smart money
    ========================= */

    static startStreaming() {

        this.fastTick();
        this.slowTick();

        setInterval(() => this.fastTick(), 10000);
        setInterval(() => this.slowTick(), 30000);
    }

    static async fastTick() {

        if (this.fastBusy) return;
        this.fastBusy = true;

        try {
            const indices = await NSEService.getIndices();

            if (indices && indices.length) {
                const payload = {
                    type: "indices",
                    indices,
                    marketStatus: NSEService.state.marketStatus,
                    live: NSEService.state.usingLiveData,
                    timestamp: Date.now()
                };
                this.lastSnapshot = payload;
                io.emit("market-data", payload);
            }
        } catch (error) {
            console.error("NSE fast stream error:", error.message);
        } finally {
            this.fastBusy = false;
        }
    }

    static async slowTick() {

        if (this.slowBusy) return;
        this.slowBusy = true;

        try {
            const [stocks, breadth, pcr, status] = await Promise.all([
                NSEService.getStockData("NIFTY 50"),
                NSEService.getMarketBreadth("NIFTY 50"),
                NSEService.getPCR("NIFTY"),
                NSEService.getMarketStatus()
            ]);

            io.emit("market-update", {
                type: "market-update",
                stocks,
                breadth,
                pcr,
                marketStatus: status?.market,
                live: NSEService.state.usingLiveData,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error("NSE slow stream error:", error.message);
        } finally {
            this.slowBusy = false;
        }
    }
}
/* =========================================
   AI SERVER COMMUNICATION
========================================= */

class AIServer {

    static async getPrediction(data) {

        try {

            const response =
                await axios.post(

                    "http://localhost:8000/predict",

                    data
                );

            return response.data;

        } catch (error) {

            console.error(
                "AI Server Error:",
                error
            );

            return null;
        }
    }
}

/* =========================================
   AUTO START
========================================= */

(async () => {

    await NSEMarketStream.initialize();

    server.listen(PORT, () => {

        console.log(`
        =========================================
        TRADEFINDER AI SERVER RUNNING
        =========================================

        PORT: ${PORT}

        MODE: INSTITUTIONAL

        =========================================
        `);
    });

})();

/* =========================================
   EXPORTS
========================================= */

module.exports = {

    app,

    server,

    io,

    redis
};