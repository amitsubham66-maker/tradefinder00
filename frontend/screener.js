/* =========================================
   TRADEFINDER AI - SCREENER ENGINE
========================================= */

console.log(`
=========================================
SCREENER ENGINE INITIALIZED
Institutional AI Scanning Active
=========================================
`);

/* =========================================
   SCREENER CONFIG
========================================= */

const ScreenerConfig = {

    UPDATE_INTERVAL: 5000,

    MIN_VOLUME_SPIKE: 2,

    MIN_CONFIDENCE: 75,

    ENABLE_BREAKOUT_SCAN: true,

    ENABLE_MOMENTUM_SCAN: true,

    ENABLE_OPTIONS_SCAN: true,

    ENABLE_SMART_MONEY_SCAN: true,

    MAX_RESULTS: 25
};

/* =========================================
   SCREENER STATE
========================================= */

const ScreenerState = {

    screenedStocks: [],

    breakoutStocks: [],

    momentumStocks: [],

    volumeStocks: [],

    smartMoneyStocks: [],

    optionsStocks: [],

    topOpportunities: []
};

/* =========================================
   MAIN SCREENER ENGINE
========================================= */

class ScreenerEngine {

    /* =========================
       INITIALIZE
    ========================= */

    static initialize() {

        console.log(
            "Screener Engine Started"
        );

        this.startRealtimeScanning();
    }

    /* =========================
       REALTIME LOOP
    ========================= */

    static startRealtimeScanning() {

        setInterval(async () => {

            try {

                await this.scanMarket();

                this.rankOpportunities();

                this.updateUI();

            } catch (error) {

                console.error(
                    "Screener Error:",
                    error
                );
            }

        }, ScreenerConfig.UPDATE_INTERVAL);
    }

    /* =========================
       MARKET SCAN
    ========================= */

    static async scanMarket() {

        ScreenerState.screenedStocks = [];

        const stocks =
            TradeFinderScanner
            .ScannerState
            .allStocks || [];

        stocks.forEach(stock => {

            const result =
                this.analyzeStock(stock);

            if (result) {

                ScreenerState
                .screenedStocks
                .push(result);
            }
        });
    }

    /* =========================
       ANALYZE STOCK
    ========================= */

    static analyzeStock(stock) {

        const indicators =
            stock.indicators;

        let score = 0;

        let tags = [];

        /* =====================
           BREAKOUT
        ===================== */

        if (

            ScreenerConfig
            .ENABLE_BREAKOUT_SCAN &&

            indicators.supertrend
            .signal === "BUY" &&

            indicators.volume.spike

        ) {

            score += 30;

            tags.push(
                "BREAKOUT"
            );
        }

        /* =====================
           MOMENTUM
        ===================== */

        if (

            ScreenerConfig
            .ENABLE_MOMENTUM_SCAN &&

            indicators.rsi > 65 &&

            indicators.macd.signal ===
            "BULLISH"

        ) {

            score += 25;

            tags.push(
                "MOMENTUM"
            );
        }

        /* =====================
           VOLUME
        ===================== */

        if (

            indicators.volume.ratio >

            ScreenerConfig
            .MIN_VOLUME_SPIKE

        ) {

            score += 20;

            tags.push(
                "VOLUME_SPIKE"
            );
        }

        /* =====================
           SMART MONEY
        ===================== */

        if (

            ScreenerConfig
            .ENABLE_SMART_MONEY_SCAN &&

            stock.smartMoney

        ) {

            score += 25;

            tags.push(
                "SMART_MONEY"
            );
        }

        if (
            score <
            ScreenerConfig
            .MIN_CONFIDENCE
        ) {

            return null;
        }

        return {

            symbol:
                stock.symbol,

            price:
                stock.price,

            score,

            tags,

            signal:
                score > 85
                ? "STRONG_BUY"
                : "BUY",

            confidence:
                score
        };
    }

    /* =========================
       AI RANKING
    ========================= */

    static rankOpportunities() {

        ScreenerState.topOpportunities =

            ScreenerState
            .screenedStocks

            .sort(
                (a, b) =>
                    b.score - a.score
            )

            .slice(
                0,
                ScreenerConfig
                .MAX_RESULTS
            );
    }

    /* =========================
       UI UPDATE
    ========================= */

    static updateUI() {

        const container =
            document.getElementById(
                "aiScreener"
            );

        if (!container) return;

        container.innerHTML = "";

        ScreenerState
        .topOpportunities
        .forEach((stock, index) => {

            container.innerHTML += `

                <div class="
                    screener-card
                    ${
                        stock.signal ===
                        "STRONG_BUY"

                        ? "strong-buy"

                        : "buy"
                    }
                ">

                    <div class="
                        screener-rank
                    ">

                        #${index + 1}

                    </div>

                    <div class="
                        screener-symbol
                    ">

                        ${stock.symbol}

                    </div>

                    <div class="
                        screener-price
                    ">

                        ₹${stock.price}

                    </div>

                    <div class="
                        screener-score
                    ">

                        ${stock.score}%

                    </div>

                    <div class="
                        screener-tags
                    ">

                        ${stock.tags.join(
                            " | "
                        )}

                    </div>

                </div>
            `;
        });
    }
}

/* =========================================
   MULTI TIMEFRAME ANALYZER
========================================= */

class MultiTimeframeAnalyzer {

    static analyze(stock) {

        return {

            "1m":
                "BULLISH",

            "5m":
                "BULLISH",

            "15m":
                "NEUTRAL",

            "1h":
                "BULLISH",

            "1d":
                "STRONG_BULLISH"
        };
    }
}

/* =========================================
   AI STOCK RANKER
========================================= */

class AIStockRanker {

    static rank(stocks) {

        return stocks.sort(
            (a, b) =>
                b.confidence -
                a.confidence
        );
    }
}

/* =========================================
   AUTO INITIALIZE
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        ScreenerEngine.initialize();
    }
);

/* =========================================
   EXPORTS
========================================= */

window.TradeFinderScreener = {

    ScreenerEngine,

    ScreenerState,

    MultiTimeframeAnalyzer,

    AIStockRanker
};

console.log(
    "Institutional Screener Engine Ready"
);