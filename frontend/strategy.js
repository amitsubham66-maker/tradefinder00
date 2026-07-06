/* =========================================
   TRADEFINDER AI - STRATEGY ENGINE
========================================= */

console.log(`
=========================================
STRATEGY ENGINE INITIALIZED
AI Trading Intelligence Activated
=========================================
`);

/* =========================================
   STRATEGY CONFIG
========================================= */

const StrategyConfig = {

    MIN_CONFIDENCE: 75,

    RISK_REWARD_RATIO: 2,

    SCALPING_ENABLED: true,

    BREAKOUT_ENABLED: true,

    REVERSAL_ENABLED: true,

    TREND_ENABLED: true,

    OPTIONS_ENABLED: true
};

/* =========================================
   STRATEGY STATE
========================================= */

const StrategyState = {

    activeSignals: [],

    scalpingSignals: [],

    breakoutSignals: [],

    reversalSignals: [],

    trendSignals: [],

    optionsSignals: []
};

/* =========================================
   MAIN STRATEGY ENGINE
========================================= */

class StrategyEngine {

    static async initialize() {

        console.log(
            "Strategy Engine Started"
        );

        this.startRealtimeLoop();
    }

    static startRealtimeLoop() {

        setInterval(async () => {

            try {

                await this.generateSignals();

                this.updateUI();

            } catch (error) {

                console.error(
                    "Strategy Error:",
                    error
                );
            }

        }, 4000);
    }

    /* =========================
       GENERATE SIGNALS
    ========================= */

    static async generateSignals() {

        StrategyState.activeSignals = [];

        const bullishStocks =
            TradeFinderScanner
            .ScannerState
            .bullishStocks;

        for (
            const stock of bullishStocks
        ) {

            const signal =
                this.analyzeStock(stock);

            if (
                signal &&
                signal.confidence >=
                StrategyConfig
                .MIN_CONFIDENCE
            ) {

                StrategyState
                .activeSignals
                .push(signal);
            }
        }

        this.sortSignals();
    }

    /* =========================
       ANALYZE STOCK
    ========================= */

    static analyzeStock(stock) {

        const indicators =
            stock.indicators;

        const strategies = [];

        /* =====================
           SCALPING
        ===================== */

        if (
            StrategyConfig
            .SCALPING_ENABLED
        ) {

            const scalp =
                ScalpingStrategy
                .analyze(stock);

            if (scalp) {

                strategies.push(scalp);
            }
        }

        /* =====================
           BREAKOUT
        ===================== */

        if (
            StrategyConfig
            .BREAKOUT_ENABLED
        ) {

            const breakout =
                BreakoutStrategy
                .analyze(stock);

            if (breakout) {

                strategies.push(breakout);
            }
        }

        /* =====================
           REVERSAL
        ===================== */

        if (
            StrategyConfig
            .REVERSAL_ENABLED
        ) {

            const reversal =
                ReversalStrategy
                .analyze(stock);

            if (reversal) {

                strategies.push(reversal);
            }
        }

        /* =====================
           TREND FOLLOWING
        ===================== */

        if (
            StrategyConfig
            .TREND_ENABLED
        ) {

            const trend =
                TrendStrategy
                .analyze(stock);

            if (trend) {

                strategies.push(trend);
            }
        }

        if (
            strategies.length === 0
        ) {

            return null;
        }

        return strategies.sort(
            (a, b) =>
                b.confidence -
                a.confidence
        )[0];
    }

    /* =========================
       SORT SIGNALS
    ========================= */

    static sortSignals() {

        StrategyState.activeSignals
        .sort(
            (a, b) =>
                b.confidence -
                a.confidence
        );
    }

    /* =========================
       UI UPDATE
    ========================= */

    static updateUI() {

        const container =
            document.getElementById(
                "strategySignals"
            );

        if (!container) return;

        container.innerHTML = "";

        StrategyState.activeSignals
        .forEach(signal => {

            container.innerHTML += `

                <div class="
                    signal-card
                    ${
                        signal.signal ===
                        "BUY"

                        ? "bullish"

                        : "bearish"
                    }
                ">

                    <div class="signal-header">

                        <div class="signal-symbol">
                            ${signal.symbol}
                        </div>

                        <div class="signal-confidence">
                            ${signal.confidence}%
                        </div>

                    </div>

                    <div class="signal-body">

                        <div>
                            Strategy:
                            ${signal.strategy}
                        </div>

                        <div>
                            Entry:
                            ₹${signal.entry}
                        </div>

                        <div>
                            SL:
                            ₹${signal.stopLoss}
                        </div>

                        <div>
                            Target:
                            ₹${signal.target}
                        </div>

                    </div>

                </div>
            `;
        });
    }
}

/* =========================================
   SCALPING STRATEGY
========================================= */

class ScalpingStrategy {

    static analyze(stock) {

        const indicators =
            stock.indicators;

        if (

            indicators.rsi > 60 &&

            indicators.momentum > 2 &&

            indicators.volume.spike

        ) {

            return {

                symbol:
                    stock.symbol,

                strategy:
                    "SCALPING",

                signal:
                    "BUY",

                entry:
                    stock.price,

                stopLoss:
                    stock.price - 5,

                target:
                    stock.price + 10,

                confidence: 82
            };
        }

        return null;
    }
}

/* =========================================
   BREAKOUT STRATEGY
========================================= */

class BreakoutStrategy {

    static analyze(stock) {

        const indicators =
            stock.indicators;

        if (

            indicators.supertrend
            .signal === "BUY" &&

            indicators.rsi > 65 &&

            indicators.volume.spike

        ) {

            return {

                symbol:
                    stock.symbol,

                strategy:
                    "BREAKOUT",

                signal:
                    "BUY",

                entry:
                    stock.price,

                stopLoss:
                    stock.price - 8,

                target:
                    stock.price + 20,

                confidence: 91
            };
        }

        return null;
    }
}

/* =========================================
   REVERSAL STRATEGY
========================================= */

class ReversalStrategy {

    static analyze(stock) {

        const indicators =
            stock.indicators;

        if (

            indicators.rsi < 30 &&

            indicators.macd.signal ===
            "BULLISH"

        ) {

            return {

                symbol:
                    stock.symbol,

                strategy:
                    "REVERSAL",

                signal:
                    "BUY",

                entry:
                    stock.price,

                stopLoss:
                    stock.price - 6,

                target:
                    stock.price + 15,

                confidence: 78
            };
        }

        return null;
    }
}

/* =========================================
   TREND STRATEGY
========================================= */

class TrendStrategy {

    static analyze(stock) {

        const indicators =
            stock.indicators;

        if (

            indicators.trend ===
            "STRONG_BULLISH" &&

            indicators.macd.signal ===
            "BULLISH"

        ) {

            return {

                symbol:
                    stock.symbol,

                strategy:
                    "TREND FOLLOWING",

                signal:
                    "BUY",

                entry:
                    stock.price,

                stopLoss:
                    stock.price - 12,

                target:
                    stock.price + 30,

                confidence: 88
            };
        }

        return null;
    }
}

/* =========================================
   OPTIONS STRATEGY
========================================= */

class OptionsStrategy {

    static analyze() {

        const bias =
            TradeFinderOptions
            .OptionsState
            .marketBias;

        if (
            bias === "STRONG_BULLISH"
        ) {

            return {

                strategy:
                    "CALL BUYING",

                confidence: 90
            };
        }

        if (
            bias === "STRONG_BEARISH"
        ) {

            return {

                strategy:
                    "PUT BUYING",

                confidence: 90
            };
        }

        return {

            strategy:
                "NEUTRAL",

            confidence: 50
        };
    }
}

/* =========================================
   AUTO INITIALIZE
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        StrategyEngine.initialize();
    }
);

/* =========================================
   EXPORTS
========================================= */

window.TradeFinderStrategy = {

    StrategyEngine,

    StrategyState,

    ScalpingStrategy,

    BreakoutStrategy,

    ReversalStrategy,

    TrendStrategy,

    OptionsStrategy
};

console.log(
    "Institutional Strategy Engine Ready"
);