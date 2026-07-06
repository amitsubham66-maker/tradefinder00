/* =========================================
   TRADEFINDER AI - MAIN FRONTEND ENGINE
========================================= */

console.clear();

console.log(`
=========================================
TRADEFINDER AI ENGINE INITIALIZED
Realtime Market Intelligence Activated
=========================================
`);

/* =========================================
   GLOBAL STATE
========================================= */

const AppState = {

    websocket: null,

    connected: false,

    marketStatus: "CLOSED",

    bullishProbability: 0,

    bearishProbability: 0,

    aiConfidence: 0,

    signals: [],

    watchlist: [],

    marketData: {},

    heatmapData: {},

    scannerData: [],

    optionsData: {},

    chart: null,

    reconnectAttempts: 0
};

/* =========================================
   CONFIG
========================================= */

const CONFIG = {

    API_BASE: "http://localhost:8000",

    WS_URL: "ws://localhost:8000/ws",

    RECONNECT_INTERVAL: 3000,

    MAX_RECONNECT_ATTEMPTS: 20,

    SIGNAL_REFRESH_INTERVAL: 5000,

    MARKET_REFRESH_INTERVAL: 2000,

    AI_REFRESH_INTERVAL: 4000
};

/* =========================================
   DOM ELEMENTS
========================================= */

const DOM = {

    bullishStrength: document.getElementById("bullishStrength"),

    bearishStrength: document.getElementById("bearishStrength"),

    aiSignal: document.getElementById("aiSignal"),

    marketStatus: document.getElementById("marketStatus"),

    livePrice: document.getElementById("livePrice"),

    signalTable: document.getElementById("signalTable"),

    heatmapContainer: document.getElementById("heatmapContainer"),

    scannerContainer: document.getElementById("scannerContainer"),

    aiConfidence: document.getElementById("aiConfidence"),

    clock: document.getElementById("clock"),

    chartCanvas: document.getElementById("marketChart")
};

/* =========================================
   INIT APP
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeApp();
});

/* =========================================
   INITIALIZE
========================================= */

async function initializeApp() {

    console.log("Initializing TradeFinder AI...");

    startRealtimeClock();

    initializeChart();

    initializeWebSocket();

    startRealtimeEngine();

    initializeAI();

    initializeNotifications();

    console.log("TradeFinder AI Fully Loaded");
}

/* =========================================
   REALTIME CLOCK
========================================= */

function startRealtimeClock() {

    setInterval(() => {

        const now = new Date();

        if (DOM.clock) {

            DOM.clock.innerText =
                now.toLocaleTimeString();
        }

    }, 1000);
}

/* =========================================
   CHART INITIALIZATION
========================================= */

function initializeChart() {

    if (!DOM.chartCanvas) return;

    const ctx = DOM.chartCanvas.getContext("2d");

    AppState.chart = new Chart(ctx, {

        type: "line",

        data: {

            labels: [],

            datasets: [{

                label: "AI Prediction",

                data: [],

                borderColor: "#00ffa3",

                borderWidth: 3,

                tension: 0.4,

                fill: true,

                backgroundColor: "rgba(0,255,163,0.12)",

                pointRadius: 2,

                pointBackgroundColor: "#00ffa3"
            }]
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {

                    display: false
                }
            },

            scales: {

                x: {

                    ticks: {

                        color: "#94a3b8"
                    },

                    grid: {

                        color: "rgba(255,255,255,0.05)"
                    }
                },

                y: {

                    ticks: {

                        color: "#94a3b8"
                    },

                    grid: {

                        color: "rgba(255,255,255,0.05)"
                    }
                }
            }
        }
    });

    generateInitialChartData();
}

/* =========================================
   INITIAL CHART DATA
========================================= */

function generateInitialChartData() {

    const labels = [];

    const values = [];

    for (let i = 0; i < 20; i++) {

        labels.push(i);

        values.push(
            Math.floor(Math.random() * 100)
        );
    }

    AppState.chart.data.labels = labels;

    AppState.chart.data.datasets[0].data = values;

    AppState.chart.update();
}

/* =========================================
   UPDATE CHART
========================================= */

function updateChart(value) {

    if (!AppState.chart) return;

    const currentTime =
        new Date().toLocaleTimeString();

    AppState.chart.data.labels.push(currentTime);

    AppState.chart.data.datasets[0].data.push(value);

    if (AppState.chart.data.labels.length > 20) {

        AppState.chart.data.labels.shift();

        AppState.chart.data.datasets[0].data.shift();
    }

    AppState.chart.update();
}

/* =========================================
   WEBSOCKET CONNECTION
========================================= */

function initializeWebSocket() {

    console.log("Connecting WebSocket...");

    AppState.websocket =
        new WebSocket(CONFIG.WS_URL);

    AppState.websocket.onopen = () => {

        console.log("WebSocket Connected");

        AppState.connected = true;

        AppState.reconnectAttempts = 0;

        updateConnectionStatus(true);
    };

    AppState.websocket.onmessage = (event) => {

        try {

            const data =
                JSON.parse(event.data);

            handleRealtimeData(data);

        } catch (error) {

            console.error(
                "WebSocket Parse Error:",
                error
            );
        }
    };

    AppState.websocket.onclose = () => {

        console.warn("WebSocket Disconnected");

        AppState.connected = false;

        updateConnectionStatus(false);

        attemptReconnect();
    };

    AppState.websocket.onerror = (error) => {

        console.error(
            "WebSocket Error:",
            error
        );
    };
}

/* =========================================
   RECONNECT LOGIC
========================================= */

function attemptReconnect() {

    if (
        AppState.reconnectAttempts >=
        CONFIG.MAX_RECONNECT_ATTEMPTS
    ) {

        console.error(
            "Max reconnect attempts reached"
        );

        return;
    }

    AppState.reconnectAttempts++;

    console.log(
        `Reconnect Attempt ${AppState.reconnectAttempts}`
    );

    setTimeout(() => {

        initializeWebSocket();

    }, CONFIG.RECONNECT_INTERVAL);
}

/* =========================================
   HANDLE REALTIME DATA
========================================= */

function handleRealtimeData(data) {

    console.log("Realtime Data:", data);

    switch (data.type) {

        case "market_update":

            updateMarketData(data.payload);

            break;

        case "ai_signal":

            updateAISignal(data.payload);

            break;

        case "heatmap":

            updateHeatmap(data.payload);

            break;

        case "scanner":

            updateScanner(data.payload);

            break;

        case "options":

            updateOptionsData(data.payload);

            break;

        default:

            console.warn(
                "Unknown message type:",
                data.type
            );
    }
}

/* =========================================
   MARKET DATA UPDATE
========================================= */

function updateMarketData(payload) {

    AppState.marketData = payload;

    if (DOM.livePrice) {

        DOM.livePrice.innerText =
            payload.price || "--";
    }

    if (DOM.bullishStrength) {

        DOM.bullishStrength.innerText =
            `${payload.bullish}%`;
    }

    if (DOM.bearishStrength) {

        DOM.bearishStrength.innerText =
            `${payload.bearish}%`;
    }

    updateChart(payload.bullish);

    animateMarketMovement(payload);
}

/* =========================================
   AI SIGNAL UPDATE
========================================= */

function updateAISignal(payload) {

    AppState.aiConfidence =
        payload.confidence;

    if (DOM.aiSignal) {

        DOM.aiSignal.innerHTML = `
            <span class="${
                payload.signal === "BUY"
                ? "buy"
                : "sell"
            }">
                ${payload.signal}
            </span>
        `;
    }

    if (DOM.aiConfidence) {

        DOM.aiConfidence.innerText =
            `${payload.confidence}%`;
    }

    renderSignal(payload);

    triggerNotification(payload);
}

/* =========================================
   SIGNAL TABLE
========================================= */

function renderSignal(signal) {

    if (!DOM.signalTable) return;

    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${signal.stock}</td>

        <td class="${
            signal.signal === "BUY"
            ? "buy"
            : "sell"
        }">
            ${signal.signal}
        </td>

        <td>${signal.entry}</td>

        <td>${signal.target}</td>

        <td>${signal.stoploss}</td>

        <td>${signal.confidence}%</td>

        <td>
            <span class="active-status">
                ACTIVE
            </span>
        </td>
    `;

    DOM.signalTable.prepend(row);

    if (DOM.signalTable.children.length > 15) {

        DOM.signalTable.removeChild(
            DOM.signalTable.lastChild
        );
    }
}

/* =========================================
   HEATMAP UPDATE
========================================= */

function updateHeatmap(payload) {

    AppState.heatmapData = payload;

    if (!DOM.heatmapContainer) return;

    DOM.heatmapContainer.innerHTML = "";

    payload.forEach((sector) => {

        const div = document.createElement("div");

        div.className = `
            heat-box
            ${
                sector.change > 0
                ? "heat-green"
                : "heat-red"
            }
        `;

        div.innerHTML = `
            <h3>${sector.name}</h3>
            <h2>${sector.change}%</h2>
        `;

        DOM.heatmapContainer.appendChild(div);
    });
}

/* =========================================
   SCANNER UPDATE
========================================= */

function updateScanner(payload) {

    AppState.scannerData = payload;

    console.log("Scanner Updated");
}

/* =========================================
   OPTIONS UPDATE
========================================= */

function updateOptionsData(payload) {

    AppState.optionsData = payload;

    console.log("Options Data Updated");
}

/* =========================================
   AI ENGINE
========================================= */

function initializeAI() {

    console.log(
        "Initializing AI Prediction Engine..."
    );

    setInterval(() => {

        simulateAIPrediction();

    }, CONFIG.AI_REFRESH_INTERVAL);
}

/* =========================================
   AI PREDICTION SIMULATION
========================================= */

function simulateAIPrediction() {

    const bullish =
        Math.floor(Math.random() * 100);

    const bearish = 100 - bullish;

    const confidence =
        Math.floor(Math.random() * 100);

    updateMarketData({

        bullish,

        bearish,

        price:
            (22000 + Math.random() * 100)
            .toFixed(2)
    });

    updateAISignal({

        signal:
            bullish > 60
            ? "BUY"
            : "SELL",

        stock: "NIFTY",

        entry:
            (22000 + Math.random() * 100)
            .toFixed(2),

        target:
            (22100 + Math.random() * 100)
            .toFixed(2),

        stoploss:
            (21900 + Math.random() * 100)
            .toFixed(2),

        confidence
    });
}

/* =========================================
   MARKET MOVEMENT ANIMATION
========================================= */

function animateMarketMovement(payload) {

    if (!DOM.livePrice) return;

    DOM.livePrice.classList.add("realtime");

    setTimeout(() => {

        DOM.livePrice.classList.remove(
            "realtime"
        );

    }, 500);
}

/* =========================================
   CONNECTION STATUS
========================================= */

function updateConnectionStatus(status) {

    if (!DOM.marketStatus) return;

    DOM.marketStatus.innerText =
        status
        ? "LIVE"
        : "DISCONNECTED";

    DOM.marketStatus.style.color =
        status
        ? "#00ffa3"
        : "#ff0055";
}

/* =========================================
   NOTIFICATIONS
========================================= */

function initializeNotifications() {

    if (
        "Notification" in window
    ) {

        Notification.requestPermission();
    }
}

/* =========================================
   TRIGGER ALERT
========================================= */

function triggerNotification(signal) {

    if (
        Notification.permission === "granted"
    ) {

        new Notification(
            `AI ${signal.signal} Signal`,
            {

                body:
                    `${signal.stock} | Confidence ${signal.confidence}%`,

                icon: "logo.png"
            }
        );
    }
}

/* =========================================
   REALTIME ENGINE
========================================= */

function startRealtimeEngine() {

    console.log(
        "Realtime Engine Started"
    );

    setInterval(() => {

        fetchMarketData();

    }, CONFIG.MARKET_REFRESH_INTERVAL);

    setInterval(() => {

        fetchSignals();

    }, CONFIG.SIGNAL_REFRESH_INTERVAL);
}

/* =========================================
   FETCH MARKET DATA
========================================= */

async function fetchMarketData() {

    try {

        const response = await fetch(
            `${CONFIG.API_BASE}/market`
        );

        const data =
            await response.json();

        updateMarketData(data);

    } catch (error) {

        console.error(
            "Market API Error:",
            error
        );
    }
}

/* =========================================
   FETCH SIGNALS
========================================= */

async function fetchSignals() {

    try {

        const response = await fetch(
            `${CONFIG.API_BASE}/signals`
        );

        const data =
            await response.json();

        data.forEach(signal => {

            renderSignal(signal);
        });

    } catch (error) {

        console.error(
            "Signal API Error:",
            error
        );
    }
}

/* =========================================
   THEME ENGINE
========================================= */

function toggleTheme() {

    document.body.classList.toggle(
        "light-theme"
    );
}

/* =========================================
   PERFORMANCE MONITOR
========================================= */

setInterval(() => {

    const memory =
        performance.memory;

    if (memory) {

        console.log(`
        JS Heap:
        ${
            (
                memory.usedJSHeapSize /
                1048576
            ).toFixed(2)
        } MB
        `);
    }

}, 10000);

/* =========================================
   AI MARKET SESSION DETECTOR
========================================= */

function detectMarketSession() {

    const now = new Date();

    const hour = now.getHours();

    if (hour >= 9 && hour < 10) {

        return "OPENING VOLATILITY";
    }

    if (hour >= 10 && hour < 13) {

        return "TREND SESSION";
    }

    if (hour >= 13 && hour < 15) {

        return "REVERSAL ZONE";
    }

    return "MARKET CLOSED";
}

/* =========================================
   EXPORT ENGINE
========================================= */

window.TradeFinderAI = {

    AppState,

    initializeApp,

    fetchMarketData,

    fetchSignals,

    updateAISignal,

    updateMarketData
};

console.log(
    "TradeFinder AI Engine Ready"
);