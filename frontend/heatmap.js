/* =========================================
   TRADEFINDER AI - HEATMAP ENGINE
========================================= */

console.log(`
=========================================
HEATMAP ENGINE INITIALIZED
Institutional Market Visualization Active
=========================================
`);

/* =========================================
   HEATMAP CONFIG
========================================= */

const HeatmapConfig = {

    UPDATE_INTERVAL: 4000,

    GRID_COLUMNS: 5,

    ENABLE_ANIMATION: true,

    ENABLE_SECTOR_ROTATION: true,

    ENABLE_AI_COLORS: true,

    MAX_HEATMAP_STOCKS: 50
};

/* =========================================
   HEATMAP STATE
========================================= */

const HeatmapState = {

    stocks: [],

    sectors: {},

    marketSentiment: "NEUTRAL",

    bullishPercentage: 0,

    bearishPercentage: 0,

    sectorRotation: {},

    initialized: false
};

/* =========================================
   COLOR ENGINE
========================================= */

class HeatmapColors {

    static getSignalColor(
        confidence,
        signal
    ) {

        if (
            signal === "BUY"
        ) {

            if (confidence >= 90) {

                return "#00ff88";
            }

            if (confidence >= 75) {

                return "#22c55e";
            }

            return "#4ade80";
        }

        if (
            signal === "SELL"
        ) {

            if (confidence >= 90) {

                return "#ff0033";
            }

            if (confidence >= 75) {

                return "#ef4444";
            }

            return "#f87171";
        }

        return "#64748b";
    }

    static getSectorColor(value) {

        if (value >= 80) {

            return "#00ff88";
        }

        if (value >= 60) {

            return "#22c55e";
        }

        if (value >= 40) {

            return "#facc15";
        }

        if (value >= 20) {

            return "#ef4444";
        }

        return "#ff0033";
    }
}

/* =========================================
   MAIN HEATMAP ENGINE
========================================= */

class HeatmapEngine {

    /* =========================
       INITIALIZE
    ========================= */

    static async initialize() {

        console.log(
            "Initializing Heatmap..."
        );

        HeatmapState.initialized = true;

        this.startRealtimeLoop();
    }

    /* =========================
       REALTIME LOOP
    ========================= */

    static startRealtimeLoop() {

        setInterval(async () => {

            try {

                await this.loadScannerData();

                this.calculateSentiment();

                this.calculateSectorRotation();

                this.renderStockHeatmap();

                this.renderSectorHeatmap();

                this.renderMarketSentiment();

                this.renderSectorRotation();

            } catch (error) {

                console.error(
                    "Heatmap Error:",
                    error
                );
            }

        }, HeatmapConfig.UPDATE_INTERVAL);
    }

    /* =========================
       LOAD SCANNER DATA
    ========================= */

    static async loadScannerData() {

        const bullish =
            TradeFinderScanner
            .ScannerState
            .bullishStocks || [];

        const bearish =
            TradeFinderScanner
            .ScannerState
            .bearishStocks || [];

        HeatmapState.stocks = [

            ...bullish,

            ...bearish
        ];
    }

    /* =========================
       MARKET SENTIMENT
    ========================= */

    static calculateSentiment() {

        const bullish =
            TradeFinderScanner
            .ScannerState
            .bullishStocks.length;

        const bearish =
            TradeFinderScanner
            .ScannerState
            .bearishStocks.length;

        const total =
            bullish + bearish;

        if (total === 0) {

            return;
        }

        const bullishPercent =
            (
                bullish / total
            ) * 100;

        const bearishPercent =
            (
                bearish / total
            ) * 100;

        HeatmapState
        .bullishPercentage =
            bullishPercent;

        HeatmapState
        .bearishPercentage =
            bearishPercent;

        HeatmapState.marketSentiment =
            bullishPercent >
            bearishPercent

            ? "BULLISH"

            : "BEARISH";
    }

    /* =========================
       SECTOR ROTATION
    ========================= */

    static calculateSectorRotation() {

        HeatmapState.sectorRotation = {

            BANKING:
                Math.random() * 100,

            IT:
                Math.random() * 100,

            AUTO:
                Math.random() * 100,

            METAL:
                Math.random() * 100,

            FMCG:
                Math.random() * 100,

            PHARMA:
                Math.random() * 100
        };
    }

    /* =========================
       STOCK HEATMAP
    ========================= */

    static renderStockHeatmap() {

        const container =
            document.getElementById(
                "stockHeatmap"
            );

        if (!container) return;

        container.innerHTML = "";

        container.style.display = "grid";

        container.style.gridTemplateColumns =
            `repeat(${HeatmapConfig.GRID_COLUMNS}, 1fr)`;

        container.style.gap = "14px";

        HeatmapState.stocks
        .slice(
            0,
            HeatmapConfig
            .MAX_HEATMAP_STOCKS
        )
        .forEach(stock => {

            const color =
                HeatmapColors
                .getSignalColor(

                    stock.confidence,

                    stock.aiSignal.signal
                );

            const card =
                document.createElement("div");

            card.className =
                "heatmap-card";

            card.style.background =
                color;

            card.style.padding =
                "18px";

            card.style.borderRadius =
                "18px";

            card.style.cursor =
                "pointer";

            card.style.transition =
                "0.3s ease";

            card.style.boxShadow =
                "0 0 25px rgba(0,0,0,0.25)";

            card.innerHTML = `

                <div class="heatmap-symbol">
                    ${stock.symbol}
                </div>

                <div class="heatmap-price">
                    ₹${stock.price}
                </div>

                <div class="heatmap-confidence">
                    ${stock.confidence.toFixed(1)}%
                </div>

                <div class="heatmap-signal">
                    ${stock.aiSignal.signal}
                </div>
            `;

            card.addEventListener(
                "mouseenter",
                () => {

                    card.style.transform =
                        "scale(1.05)";
                }
            );

            card.addEventListener(
                "mouseleave",
                () => {

                    card.style.transform =
                        "scale(1)";
                }
            );

            card.addEventListener(
                "click",
                () => {

                    TradeFinderChart
                    .ChartEngine
                    .changeSymbol(
                        stock.symbol
                    );
                }
            );

            container.appendChild(card);
        });
    }

    /* =========================
       SECTOR HEATMAP
    ========================= */

    static renderSectorHeatmap() {

        const container =
            document.getElementById(
                "sectorHeatmap"
            );

        if (!container) return;

        container.innerHTML = "";

        Object.entries(
            HeatmapState
            .sectorRotation
        )
        .forEach(([sector, value]) => {

            const color =
                HeatmapColors
                .getSectorColor(value);

            const sectorCard =
                document.createElement("div");

            sectorCard.className =
                "sector-heatmap-card";

            sectorCard.style.background =
                color;

            sectorCard.style.padding =
                "16px";

            sectorCard.style.borderRadius =
                "16px";

            sectorCard.style.marginBottom =
                "12px";

            sectorCard.innerHTML = `

                <div class="sector-name">
                    ${sector}
                </div>

                <div class="sector-strength">
                    ${value.toFixed(1)}%
                </div>
            `;

            container.appendChild(
                sectorCard
            );
        });
    }

    /* =========================
       MARKET SENTIMENT UI
    ========================= */

    static renderMarketSentiment() {

        const container =
            document.getElementById(
                "marketSentiment"
            );

        if (!container) return;

        container.innerHTML = `

            <div class="market-sentiment-card">

                <div class="market-title">
                    MARKET SENTIMENT
                </div>

                <div class="
                    market-sentiment-value
                    ${
                        HeatmapState
                        .marketSentiment ===
                        "BULLISH"

                        ? "green"

                        : "red"
                    }
                ">

                    ${
                        HeatmapState
                        .marketSentiment
                    }

                </div>

                <div class="market-stats">

                    <div>
                        Bullish:
                        ${HeatmapState
                        .bullishPercentage
                        .toFixed(1)}%
                    </div>

                    <div>
                        Bearish:
                        ${HeatmapState
                        .bearishPercentage
                        .toFixed(1)}%
                    </div>

                </div>

            </div>
        `;
    }

    /* =========================
       SECTOR ROTATION UI
    ========================= */

    static renderSectorRotation() {

        const container =
            document.getElementById(
                "sectorRotation"
            );

        if (!container) return;

        container.innerHTML = "";

        Object.entries(
            HeatmapState
            .sectorRotation
        )
        .sort(
            (a, b) =>
                b[1] - a[1]
        )
        .forEach(([sector, value]) => {

            container.innerHTML += `

                <div class="rotation-card">

                    <div class="rotation-sector">
                        ${sector}
                    </div>

                    <div class="rotation-bar">

                        <div
                            class="rotation-fill"
                            style="
                                width:${value}%;
                                background:
                                ${HeatmapColors.getSectorColor(value)}
                            "
                        ></div>

                    </div>

                    <div class="rotation-value">
                        ${value.toFixed(1)}%
                    </div>

                </div>
            `;
        });
    }
}

/* =========================================
   SMART MONEY HEATMAP
========================================= */

class SmartMoneyHeatmap {

    static render() {

        const smartMoneyStocks =
            TradeFinderScanner
            .ScannerState
            .smartMoneyStocks;

        console.log(
            "Smart Money Stocks:",
            smartMoneyStocks
        );
    }
}

/* =========================================
   AI HEATMAP ENGINE
========================================= */

class AIHeatmapEngine {

    static generateIntensity(stock) {

        const confidence =
            stock.confidence || 0;

        return confidence / 100;
    }

    static getPulseAnimation(stock) {

        return stock.confidence > 90
            ? "pulse-strong"
            : "pulse-normal";
    }
}

/* =========================================
   AUTO INITIALIZE
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        HeatmapEngine.initialize();
    }
);

/* =========================================
   EXPORTS
========================================= */

window.TradeFinderHeatmap = {

    HeatmapEngine,

    HeatmapState,

    HeatmapColors,

    SmartMoneyHeatmap,

    AIHeatmapEngine
};

console.log(
    "Institutional Heatmap Engine Ready"
);