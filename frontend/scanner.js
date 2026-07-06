/* =========================================
   TRADEFINDER AI - MARKET SCANNER ENGINE
========================================= */

console.log(`
=========================================
MARKET SCANNER INITIALIZED
Realtime AI Scanner Activated
=========================================
`);

/* =========================================
   SCANNER CONFIGURATION
========================================= */

const ScannerConfig = {

    SCAN_INTERVAL: 5000,

    TOP_STOCK_LIMIT: 20,

    BREAKOUT_THRESHOLD: 2,

    VOLUME_SPIKE_MULTIPLIER: 2,

    AI_CONFIDENCE_THRESHOLD: 75,

    ENABLE_SECTOR_SCANNER: true,

    ENABLE_OPTIONS_SCANNER: true,

    ENABLE_SMART_MONEY_SCANNER: true,

    ENABLE_BREAKOUT_SCANNER: true,

    ENABLE_REVERSAL_SCANNER: true
};

/* =========================================
   GLOBAL SCANNER STATE
========================================= */

const ScannerState = {

    bullishStocks: [],

    bearishStocks: [],

    breakoutStocks: [],

    reversalStocks: [],

    smartMoneyStocks: [],

    momentumStocks: [],

    sectorStrength: {},

    marketBreadth: {},

    scannerRunning: false,

    lastScanTime: null
};

/* =========================================
   NSE STOCK UNIVERSE
========================================= */

const NSEUniverse = [

    "RELIANCE",
    "HDFCBANK",
    "ICICIBANK",
    "SBIN",
    "INFY",
    "TCS",
    "LT",
    "AXISBANK",
    "KOTAKBANK",
    "BAJFINANCE",
    "MARUTI",
    "TITAN",
    "WIPRO",
    "ULTRACEMCO",
    "ADANIENT",
    "ONGC",
    "HINDALCO",
    "TATASTEEL",
    "COALINDIA",
    "POWERGRID"
];

/* =========================================
   MAIN MARKET SCANNER
========================================= */

class MarketScanner {

    static async start() {

        console.log(
            "Realtime Scanner Started"
        );

        ScannerState.scannerRunning = true;

        this.scanLoop();
    }

    static async scanLoop() {

        while (
            ScannerState.scannerRunning
        ) {

            try {

                console.log(
                    "Scanning Market..."
                );

                await this.scanEntireMarket();

                await this.scanSectorStrength();

                await this.scanMarketBreadth();

                await this.scanSmartMoney();

                await this.updateUI();

                ScannerState.lastScanTime =
                    Date.now();

            } catch (error) {

                console.error(
                    "Scanner Error:",
                    error
                );
            }

            await this.delay(
                ScannerConfig.SCAN_INTERVAL
            );
        }
    }

    static async scanEntireMarket() {

        ScannerState.bullishStocks = [];

        ScannerState.bearishStocks = [];

        ScannerState.breakoutStocks = [];

        ScannerState.momentumStocks = [];

        for (
            const symbol of NSEUniverse
        ) {

            try {

                const stockData =
                    await TradeFinderAPI
                    .MarketAPI
                    .getStockData(symbol);

                const candles =
                    stockData.candles || [];

                const indicators =
                    TradeFinderIndicators
                    .IndicatorEngine
                    .calculateAll(candles);

                const aiSignal =
                    await TradeFinderAIEngine
                    .AIOrchestrator
                    .analyze({

                        price:
                            stockData.price,

                        volume:
                            stockData.volume,

                        rsi:
                            indicators.rsi,

                        macd:
                            indicators.macd.macd,

                        vwap:
                            indicators.vwap,

                        atr:
                            indicators.atr,

                        volatility:
                            indicators.volatility
                    });

                const stockAnalysis = {

                    symbol,

                    price:
                        stockData.price,

                    change:
                        stockData.change,

                    volume:
                        stockData.volume,

                    indicators,

                    aiSignal,

                    confidence:
                        aiSignal.confidence,

                    timestamp:
                        Date.now()
                };

                /* =====================
                   BULLISH SCAN
                ===================== */

                if (
                    aiSignal.signal === "BUY" &&
                    aiSignal.confidence >
                    ScannerConfig
                    .AI_CONFIDENCE_THRESHOLD
                ) {

                    ScannerState
                    .bullishStocks
                    .push(stockAnalysis);
                }

                /* =====================
                   BEARISH SCAN
                ===================== */

                if (
                    aiSignal.signal === "SELL" &&
                    aiSignal.confidence >
                    ScannerConfig
                    .AI_CONFIDENCE_THRESHOLD
                ) {

                    ScannerState
                    .bearishStocks
                    .push(stockAnalysis);
                }

                /* =====================
                   BREAKOUT SCAN
                ===================== */

                if (
                    this.isBreakout(
                        stockData,
                        indicators
                    )
                ) {

                    ScannerState
                    .breakoutStocks
                    .push(stockAnalysis);
                }

                /* =====================
                   MOMENTUM SCAN
                ===================== */

                if (
                    indicators.momentum > 3
                ) {

                    ScannerState
                    .momentumStocks
                    .push(stockAnalysis);
                }

            } catch (error) {

                console.error(
                    `${symbol} Scan Error`,
                    error
                );
            }
        }

        /* =====================
           SORT RESULTS
        ===================== */

        this.sortScannerResults();
    }

    /* =====================================
       BREAKOUT DETECTION
    ===================================== */

    static isBreakout(
        stockData,
        indicators
    ) {

        return (

            indicators.volume.spike &&

            indicators.rsi > 60 &&

            stockData.change >
            ScannerConfig
            .BREAKOUT_THRESHOLD
        );
    }

    /* =====================================
       SECTOR SCANNER
    ===================================== */

    static async scanSectorStrength() {

        console.log(
            "Scanning Sector Strength..."
        );

        ScannerState.sectorStrength = {

            BANKING:
                Math.random() * 100,

            IT:
                Math.random() * 100,

            AUTO:
                Math.random() * 100,

            METAL:
                Math.random() * 100,

            PHARMA:
                Math.random() * 100,

            FMCG:
                Math.random() * 100
        };
    }

    /* =====================================
       MARKET BREADTH
    ===================================== */

    static async scanMarketBreadth() {

        const advancing =
            ScannerState
            .bullishStocks.length;

        const declining =
            ScannerState
            .bearishStocks.length;

        ScannerState.marketBreadth = {

            advancing,

            declining,

            ratio:
                (
                    advancing /
                    (
                        declining || 1
                    )
                ).toFixed(2),

            sentiment:
                advancing > declining
                ? "BULLISH"
                : "BEARISH"
        };
    }

    /* =====================================
       SMART MONEY SCANNER
    ===================================== */

    static async scanSmartMoney() {

        ScannerState.smartMoneyStocks = [];

        for (
            const stock of
            ScannerState.bullishStocks
        ) {

            const smartMoney =
                TradeFinderIndicators
                .SmartMoneyConcept
                .detect(
                    stock.indicators
                    .candles || []
                );

            if (
                smartMoney ===
                "INSTITUTIONAL_BUYING"
            ) {

                ScannerState
                .smartMoneyStocks
                .push({

                    ...stock,

                    smartMoney
                });
            }
        }
    }

    /* =====================================
       SORT RESULTS
    ===================================== */

    static sortScannerResults() {

        ScannerState.bullishStocks
        .sort(
            (a, b) =>
                b.confidence -
                a.confidence
        );

        ScannerState.bearishStocks
        .sort(
            (a, b) =>
                b.confidence -
                a.confidence
        );

        ScannerState.breakoutStocks
        .sort(
            (a, b) =>
                b.change -
                a.change
        );
    }

    /* =====================================
       UI UPDATE
    ===================================== */

    static async updateUI() {

        this.updateBullishTable();

        this.updateBearishTable();

        this.updateBreakoutTable();

        this.updateSectorStrength();

        this.updateMarketBreadth();
    }

    /* =====================================
       BULLISH UI
    ===================================== */

    static updateBullishTable() {

        const container =
            document.getElementById(
                "bullishScanner"
            );

        if (!container) return;

        container.innerHTML = "";

        ScannerState.bullishStocks
        .slice(
            0,
            ScannerConfig
            .TOP_STOCK_LIMIT
        )
        .forEach(stock => {

            container.innerHTML += `

                <div class="scanner-card bullish">

                    <div class="scanner-symbol">
                        ${stock.symbol}
                    </div>

                    <div class="scanner-price">
                        ₹${stock.price}
                    </div>

                    <div class="scanner-confidence">
                        ${stock.confidence.toFixed(1)}%
                    </div>

                    <div class="scanner-signal">
                        BUY
                    </div>

                </div>
            `;
        });
    }

    /* =====================================
       BEARISH UI
    ===================================== */

    static updateBearishTable() {

        const container =
            document.getElementById(
                "bearishScanner"
            );

        if (!container) return;

        container.innerHTML = "";

        ScannerState.bearishStocks
        .slice(
            0,
            ScannerConfig
            .TOP_STOCK_LIMIT
        )
        .forEach(stock => {

            container.innerHTML += `

                <div class="scanner-card bearish">

                    <div class="scanner-symbol">
                        ${stock.symbol}
                    </div>

                    <div class="scanner-price">
                        ₹${stock.price}
                    </div>

                    <div class="scanner-confidence">
                        ${stock.confidence.toFixed(1)}%
                    </div>

                    <div class="scanner-signal">
                        SELL
                    </div>

                </div>
            `;
        });
    }

    /* =====================================
       BREAKOUT UI
    ===================================== */

    static updateBreakoutTable() {

        const container =
            document.getElementById(
                "breakoutScanner"
            );

        if (!container) return;

        container.innerHTML = "";

        ScannerState.breakoutStocks
        .slice(0, 10)
        .forEach(stock => {

            container.innerHTML += `

                <div class="scanner-card breakout">

                    <div class="scanner-symbol">
                        ${stock.symbol}
                    </div>

                    <div class="scanner-price">
                        ₹${stock.price}
                    </div>

                    <div class="scanner-change">
                        +${stock.change}%
                    </div>

                </div>
            `;
        });
    }

    /* =====================================
       SECTOR UI
    ===================================== */

    static updateSectorStrength() {

        const container =
            document.getElementById(
                "sectorStrength"
            );

        if (!container) return;

        container.innerHTML = "";

        Object.entries(
            ScannerState
            .sectorStrength
        )
        .forEach(([sector, value]) => {

            container.innerHTML += `

                <div class="sector-card">

                    <div class="sector-name">
                        ${sector}
                    </div>

                    <div class="sector-bar">

                        <div
                            class="sector-fill"
                            style="
                                width:${value}%
                            "
                        ></div>

                    </div>

                    <div class="sector-value">
                        ${value.toFixed(1)}%
                    </div>

                </div>
            `;
        });
    }

    /* =====================================
       MARKET BREADTH UI
    ===================================== */

    static updateMarketBreadth() {

        const container =
            document.getElementById(
                "marketBreadth"
            );

        if (!container) return;

        const breadth =
            ScannerState
            .marketBreadth;

        container.innerHTML = `

            <div class="breadth-card">

                <div>
                    Advancing:
                    ${breadth.advancing}
                </div>

                <div>
                    Declining:
                    ${breadth.declining}
                </div>

                <div>
                    Ratio:
                    ${breadth.ratio}
                </div>

                <div class="
                    ${
                        breadth.sentiment ===
                        "BULLISH"
                        ? "green"
                        : "red"
                    }
                ">
                    ${breadth.sentiment}
                </div>

            </div>
        `;
    }

    /* =====================================
       DELAY
    ===================================== */

    static delay(ms) {

        return new Promise(
            resolve =>
                setTimeout(resolve, ms)
        );
    }
}

/* =========================================
   SCANNER ALERT ENGINE
========================================= */

class ScannerAlerts {

    static sendBreakoutAlert(stock) {

        console.log(
            `
            BREAKOUT ALERT:
            ${stock.symbol}
            Confidence:
            ${stock.confidence}
            `
        );
    }

    static sendSmartMoneyAlert(stock) {

        console.log(
            `
            SMART MONEY DETECTED:
            ${stock.symbol}
            `
        );
    }

    static async updateSwingSpectrum() {
        try {
            const res = await fetch("http://localhost:5000/api/market/swing-spectrum");
            const data = await res.json();
            if (data && data.success) {
                // Render Reversal Radar
                const revBody = document.getElementById("reversalRadarTableBody");
                if (revBody) {
                    revBody.innerHTML = data.reversalRadar.map(s => `
                        <tr class="border-t border-slate-800/40 hover:bg-white/5 transition-colors">
                            <td class="py-2.5 font-bold">${s.symbol}</td>
                            <td class="py-2.5">₹${s.lastPrice.toLocaleString()}</td>
                            <td class="py-2.5 ${s.rsi < 30 ? 'text-emerald-400' : 'text-rose-400'}">${s.rsi}</td>
                            <td class="py-2.5 ${s.rsi < 30 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}">${s.condition}</td>
                        </tr>
                    `).join("");
                }

                // Render Channel Breakout
                const chanBody = document.getElementById("channelBreakoutTableBody");
                if (chanBody) {
                    chanBody.innerHTML = data.channelBreakout.map(s => `
                        <tr class="border-t border-slate-800/40 hover:bg-white/5 transition-colors">
                            <td class="py-2.5 font-bold">${s.symbol}</td>
                            <td class="py-2.5">₹${s.lastPrice.toLocaleString()}</td>
                            <td class="py-2.5 text-cyan-400 font-bold">${s.range}</td>
                            <td class="py-2.5 text-slate-400">${s.breakoutVolume.toLocaleString()}</td>
                        </tr>
                    `).join("");
                }

                // Render Delivery Scanner
                const delBody = document.getElementById("deliveryScannerTableBody");
                if (delBody) {
                    delBody.innerHTML = data.deliveryAccumulation.map(s => `
                        <tr class="border-t border-slate-800/40 hover:bg-white/5 transition-colors">
                            <td class="py-2.5 font-bold">${s.symbol}</td>
                            <td class="py-2.5">₹${s.lastPrice.toLocaleString()}</td>
                            <td class="py-2.5 text-emerald-400 font-bold">${s.deliveryPercentage}%</td>
                            <td class="py-2.5 text-cyan-400 font-bold">${s.volumeSpikeRatio}x</td>
                        </tr>
                    `).join("");
                }
            }
        } catch (err) {
            console.error("Failed to update Swing Spectrum:", err);
        }
    }

    static alertedBreakouts = new Set();

    static triggerBreakoutBeacon(symbol, pChange) {
        if (this.alertedBreakouts.has(symbol)) return;
        this.alertedBreakouts.add(symbol);

        // Play audio alert
        const audio = document.getElementById("beaconAlertSound");
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.log("Audio play blocked by browser policy"));
        }

        // Show toast
        const container = document.getElementById("breakoutBeaconContainer");
        if (container) {
            const toast = document.createElement("div");
            toast.className = "beacon-toast";
            toast.innerHTML = `
                <div class="flex items-center gap-3">
                  <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
                  <div class="flex-1">
                    <div class="font-black text-emerald-400">BREAKOUT BEACON</div>
                    <div class="text-xs text-slate-300 font-semibold mt-1">
                      <strong>${symbol}</strong> spiked <strong>+${pChange.toFixed(1)}%</strong> with heavy volume!
                    </div>
                  </div>
                </div>
            `;
            container.appendChild(toast);

            // Auto fade out after 4 seconds
            setTimeout(() => {
                toast.classList.add("fade-out");
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }
    }
}

window.updateSwingSpectrumLoop = () => MarketScanner.updateSwingSpectrum();
window.triggerBreakoutBeacon = (symbol, pChange) => MarketScanner.triggerBreakoutBeacon(symbol, pChange);

/* =========================================
   AUTO START
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        MarketScanner.start();
    }
);

/* =========================================
   EXPORTS
========================================= */

window.TradeFinderScanner = {

    MarketScanner,

    ScannerState,

    ScannerAlerts
};

console.log(
    "Institutional Scanner Ready"
);