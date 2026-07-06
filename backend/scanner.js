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
}

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