/* =========================================
   TRADEFINDER AI - WEBSOCKET ENGINE
========================================= */

console.log(`
=========================================
WEBSOCKET ENGINE INITIALIZED
Realtime Streaming Activated
=========================================
`);

/* =========================================
   CONFIG
========================================= */

const WS_CONFIG = {

    PRIMARY_WS:
        "ws://localhost:8000/ws",

    FALLBACK_WS:
        "ws://localhost:8001/ws",

    HEARTBEAT_INTERVAL: 10000,

    RECONNECT_INTERVAL: 3000,

    MAX_RECONNECTS: 50
};

/* =========================================
   WEBSOCKET STATE
========================================= */

const WebSocketState = {

    socket: null,

    connected: false,

    reconnectAttempts: 0,

    heartbeatInterval: null,

    lastMessageTime: null,

    usingFallback: false
};

/* =========================================
   INITIALIZE
========================================= */

function initializeRealtimeSocket() {

    const url =
        WebSocketState.usingFallback
        ? WS_CONFIG.FALLBACK_WS
        : WS_CONFIG.PRIMARY_WS;

    console.log(
        `Connecting to ${url}`
    );

    WebSocketState.socket =
        new WebSocket(url);

    attachSocketListeners();
}

/* =========================================
   SOCKET LISTENERS
========================================= */

function attachSocketListeners() {

    const socket =
        WebSocketState.socket;

    socket.onopen = handleSocketOpen;

    socket.onmessage = handleSocketMessage;

    socket.onerror = handleSocketError;

    socket.onclose = handleSocketClose;
}

/* =========================================
   SOCKET OPEN
========================================= */

function handleSocketOpen() {

    console.log(
        "Realtime Socket Connected"
    );

    WebSocketState.connected = true;

    WebSocketState.reconnectAttempts = 0;

    updateRealtimeStatus(true);

    startHeartbeat();

    subscribeMarketFeeds();
}

/* =========================================
   HEARTBEAT
========================================= */

function startHeartbeat() {

    clearInterval(
        WebSocketState.heartbeatInterval
    );

    WebSocketState.heartbeatInterval =
        setInterval(() => {

            if (
                WebSocketState.connected
            ) {

                sendSocketMessage({
                    type: "ping",
                    timestamp: Date.now()
                });
            }

        }, WS_CONFIG.HEARTBEAT_INTERVAL);
}

/* =========================================
   SEND MESSAGE
========================================= */

function sendSocketMessage(message) {

    if (
        !WebSocketState.socket ||
        WebSocketState.socket.readyState !== 1
    ) {

        console.warn(
            "Socket not connected"
        );

        return;
    }

    WebSocketState.socket.send(
        JSON.stringify(message)
    );
}

/* =========================================
   SUBSCRIBE FEEDS
========================================= */

function subscribeMarketFeeds() {

    console.log(
        "Subscribing Market Feeds..."
    );

    sendSocketMessage({

        type: "subscribe",

        channels: [

            "nifty",

            "banknifty",

            "finnifty",

            "options_chain",

            "ai_signals",

            "heatmap",

            "scanner",

            "market_depth"
        ]
    });
}

/* =========================================
   SOCKET MESSAGE
========================================= */

function handleSocketMessage(event) {

    try {

        const data =
            JSON.parse(event.data);

        WebSocketState.lastMessageTime =
            Date.now();

        routeRealtimeData(data);

    } catch (error) {

        console.error(
            "Socket Parse Error:",
            error
        );
    }
}

/* =========================================
   ROUTER
========================================= */

function routeRealtimeData(data) {

    switch (data.type) {

        case "tick":

            processTickData(data.payload);

            break;

        case "market":

            processMarketData(data.payload);

            break;

        case "signal":

            processAISignal(data.payload);

            break;

        case "heatmap":

            processHeatmap(data.payload);

            break;

        case "scanner":

            processScanner(data.payload);

            break;

        case "options":

            processOptions(data.payload);

            break;

        case "depth":

            processMarketDepth(data.payload);

            break;

        case "pong":

            console.log("Heartbeat OK");

            break;

        default:

            console.warn(
                "Unknown Socket Type:",
                data.type
            );
    }
}

/* =========================================
   PROCESS TICK DATA
========================================= */

function processTickData(payload) {

    console.log(
        "Tick Data:",
        payload
    );

    updateLivePrice(payload);

    updateMiniTicker(payload);

    pushTickToChart(payload);
}

/* =========================================
   PROCESS MARKET DATA
========================================= */

function processMarketData(payload) {

    console.log(
        "Market Update:",
        payload
    );

    if (
        window.TradeFinderAI
    ) {

        window.TradeFinderAI
            .updateMarketData(payload);
    }
}

/* =========================================
   PROCESS AI SIGNAL
========================================= */

function processAISignal(payload) {

    console.log(
        "AI Signal:",
        payload
    );

    if (
        window.TradeFinderAI
    ) {

        window.TradeFinderAI
            .updateAISignal(payload);
    }

    showRealtimeSignalPopup(payload);

    playSignalSound(payload.signal);
}

/* =========================================
   PROCESS HEATMAP
========================================= */

function processHeatmap(payload) {

    console.log(
        "Heatmap Updated"
    );

    renderRealtimeHeatmap(payload);
}

/* =========================================
   PROCESS SCANNER
========================================= */

function processScanner(payload) {

    console.log(
        "Scanner Updated"
    );

    renderRealtimeScanner(payload);
}

/* =========================================
   PROCESS OPTIONS
========================================= */

function processOptions(payload) {

    console.log(
        "Options Chain Updated"
    );

    updateOptionsChain(payload);
}

/* =========================================
   PROCESS MARKET DEPTH
========================================= */

function processMarketDepth(payload) {

    console.log(
        "Market Depth Updated"
    );

    renderDepthData(payload);
}

/* =========================================
   SOCKET ERROR
========================================= */

function handleSocketError(error) {

    console.error(
        "Realtime Socket Error:",
        error
    );
}

/* =========================================
   SOCKET CLOSE
========================================= */

function handleSocketClose() {

    console.warn(
        "Realtime Socket Closed"
    );

    WebSocketState.connected = false;

    updateRealtimeStatus(false);

    clearInterval(
        WebSocketState.heartbeatInterval
    );

    attemptSocketReconnect();
}

/* =========================================
   RECONNECT SYSTEM
========================================= */

function attemptSocketReconnect() {

    if (
        WebSocketState.reconnectAttempts >=
        WS_CONFIG.MAX_RECONNECTS
    ) {

        console.error(
            "Reconnect Limit Reached"
        );

        activateFallbackSocket();

        return;
    }

    WebSocketState.reconnectAttempts++;

    console.log(
        `Reconnect Attempt ${WebSocketState.reconnectAttempts}`
    );

    setTimeout(() => {

        initializeRealtimeSocket();

    }, WS_CONFIG.RECONNECT_INTERVAL);
}

/* =========================================
   FALLBACK SYSTEM
========================================= */

function activateFallbackSocket() {

    console.warn(
        "Switching to Fallback WebSocket"
    );

    WebSocketState.usingFallback = true;

    initializeRealtimeSocket();
}

/* =========================================
   UPDATE STATUS UI
========================================= */

function updateRealtimeStatus(status) {

    const element =
        document.getElementById(
            "marketStatus"
        );

    if (!element) return;

    element.innerText =
        status
        ? "LIVE"
        : "DISCONNECTED";

    element.style.color =
        status
        ? "#00ffa3"
        : "#ff0055";
}

/* =========================================
   LIVE PRICE UPDATE
========================================= */

function updateLivePrice(payload) {

    const livePrice =
        document.getElementById(
            "livePrice"
        );

    if (!livePrice) return;

    livePrice.innerText =
        payload.price;

    livePrice.classList.add(
        "realtime"
    );

    setTimeout(() => {

        livePrice.classList.remove(
            "realtime"
        );

    }, 400);
}

/* =========================================
   MINI TICKER
========================================= */

function updateMiniTicker(payload) {

    const ticker =
        document.getElementById(
            "tickerTape"
        );

    if (!ticker) return;

    ticker.innerHTML = `
        ${payload.symbol}
        ₹${payload.price}
    `;
}

/* =========================================
   PUSH TO CHART
========================================= */

function pushTickToChart(payload) {

    if (
        window.TradeFinderAI
    ) {

        window.TradeFinderAI
            .updateMarketData({

                bullish:
                    payload.bullish || 50,

                bearish:
                    payload.bearish || 50,

                price:
                    payload.price
            });
    }
}

/* =========================================
   POPUP
========================================= */

function showRealtimeSignalPopup(signal) {

    const popup =
        document.createElement("div");

    popup.className =
        "signal-popup";

    popup.innerHTML = `
        <h3>
            ${signal.signal}
        </h3>

        <p>
            ${signal.stock}
        </p>

        <span>
            Confidence:
            ${signal.confidence}%
        </span>
    `;

    document.body.appendChild(popup);

    setTimeout(() => {

        popup.classList.add(
            "show-popup"
        );

    }, 100);

    setTimeout(() => {

        popup.remove();

    }, 5000);
}

/* =========================================
   SIGNAL SOUND
========================================= */

function playSignalSound(type) {

    const audio =
        new Audio();

    audio.src =
        type === "BUY"
        ? "assets/buy.mp3"
        : "assets/sell.mp3";

    audio.volume = 0.3;

    audio.play()
        .catch(() => {});
}

/* =========================================
   RENDER HEATMAP
========================================= */

function renderRealtimeHeatmap(data) {

    console.log(
        "Rendering Heatmap..."
    );
}

/* =========================================
   RENDER SCANNER
========================================= */

function renderRealtimeScanner(data) {

    console.log(
        "Rendering Scanner..."
    );
}

/* =========================================
   OPTIONS CHAIN
========================================= */

function updateOptionsChain(data) {

    console.log(
        "Rendering Options Chain..."
    );
}

/* =========================================
   MARKET DEPTH
========================================= */

function renderDepthData(data) {

    console.log(
        "Rendering Depth Data..."
    );
}

/* =========================================
   NETWORK MONITOR
========================================= */

setInterval(() => {

    if (
        WebSocketState.connected
    ) {

        const diff =
            Date.now() -
            WebSocketState.lastMessageTime;

        if (diff > 30000) {

            console.warn(
                "Socket Timeout Detected"
            );

            WebSocketState.socket.close();
        }
    }

}, 15000);

/* =========================================
   AUTO START
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeRealtimeSocket();
    }
);

/* =========================================
   EXPORTS
========================================= */

window.TradeFinderSocket = {

    initializeRealtimeSocket,

    sendSocketMessage,

    WebSocketState
};

console.log(
    "Realtime WebSocket Engine Ready"
);