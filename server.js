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

mongoose.connect(MONGO_URI, {

    useNewUrlParser: true,

    useUnifiedTopology: true
})

.then(() => {

    console.log(`
    =========================================
    MongoDB Connected
    =========================================
    `);

})

.catch(error => {

    console.error(
        "MongoDB Error:",
        error
    );
});

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
   NSE MARKET STREAM
========================================= */

class NSEMarketStream {

    static async initialize() {

        console.log(`
        =========================================
        NSE Market Stream Started
        =========================================
        `);

        this.startStreaming();
    }

    /* =========================
       STREAM LOOP
    ========================= */

    static startStreaming() {

        setInterval(async () => {

            try {

                const data =
                    await this.fetchMarket();

                this.broadcast(data);

                await this.cache(data);

            } catch (error) {

                console.error(
                    "NSE Stream Error:",
                    error
                );
            }

        }, 1000);
    }

    /* =========================
       FETCH MARKET
    ========================= */

    static async fetchMarket() {

        /*
        NSE / Broker APIs Here
        */

        return {

            symbol: "NIFTY",

            price:
                24500 +

                Math.random() * 100,

            volume:
                Math.floor(
                    Math.random() *
                    100000
                ),

            timestamp:
                Date.now()
        };
    }

    /* =========================
       BROADCAST
    ========================= */

    static broadcast(data) {

        io.emit(
            "market-data",
            data
        );
    }

    /* =========================
       CACHE
    ========================= */

static async cache(data) {

    return;
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