/* =========================================
   TRADEFINDER AI - PORTFOLIO ENGINE
========================================= */

console.log(`
=========================================
PORTFOLIO ENGINE INITIALIZED
Institutional Portfolio Analytics Active
=========================================
`);

/* =========================================
   PORTFOLIO CONFIG
========================================= */

const PortfolioConfig = {

    UPDATE_INTERVAL: 4000,

    INITIAL_CAPITAL: 1000000
};

/* =========================================
   PORTFOLIO STATE
========================================= */

const PortfolioState = {

    portfolioValue:
        PortfolioConfig.INITIAL_CAPITAL,

    investedCapital: 0,

    availableCapital:
        PortfolioConfig.INITIAL_CAPITAL,

    totalPnL: 0,

    dailyPnL: 0,

    weeklyPnL: 0,

    monthlyPnL: 0,

    totalTrades: 0,

    winningTrades: 0,

    losingTrades: 0,

    winRate: 0,

    profitFactor: 0,

    maxDrawdown: 0,

    sharpeRatio: 0,

    tradeHistory: [],

    strategyPerformance: {},

    sectorPerformance: {}
};

/* =========================================
   MAIN PORTFOLIO ENGINE
========================================= */

class PortfolioEngine {

    /* =========================
       INITIALIZE
    ========================= */

    static initialize() {

        console.log(
            "Portfolio Engine Started"
        );

        this.startRealtimeLoop();
    }

    /* =========================
       REALTIME LOOP
    ========================= */

    static startRealtimeLoop() {

        setInterval(() => {

            this.syncPositions();

            this.calculatePortfolioValue();

            this.calculateWinRate();

            this.calculateProfitFactor();

            this.calculateDrawdown();

            this.calculateSharpeRatio();

            this.updateStrategyPerformance();

            this.updateUI();

        }, PortfolioConfig.UPDATE_INTERVAL);
    }

    /* =========================
       SYNC POSITIONS
    ========================= */

    static syncPositions() {

        const completedTrades =
            TradeFinderExecution
            .ExecutionState
            .completedOrders;

        PortfolioState.tradeHistory =
            completedTrades;

        PortfolioState.totalTrades =
            completedTrades.length;
    }

    /* =========================
       PORTFOLIO VALUE
    ========================= */

    static calculatePortfolioValue() {

        let totalPnL = 0;

        const positions =
            TradeFinderExecution
            .ExecutionState
            .positions;

        positions.forEach(position => {

            totalPnL +=
                position.pnl || 0;
        });

        PortfolioState.totalPnL =
            totalPnL;

        PortfolioState.portfolioValue =

            PortfolioConfig
            .INITIAL_CAPITAL +

            totalPnL;

        PortfolioState.availableCapital =

            PortfolioState.portfolioValue -

            PortfolioState.investedCapital;
    }

    /* =========================
       WIN RATE
    ========================= */

    static calculateWinRate() {

        const trades =
            PortfolioState.tradeHistory;

        let wins = 0;

        let losses = 0;

        trades.forEach(trade => {

            if (
                trade.pnl > 0
            ) {

                wins++;

            } else {

                losses++;
            }
        });

        PortfolioState.winningTrades =
            wins;

        PortfolioState.losingTrades =
            losses;

        const total =
            wins + losses;

        PortfolioState.winRate =

            total > 0

            ? (
                (
                    wins / total
                ) * 100
            ).toFixed(2)

            : 0;
    }

    /* =========================
       PROFIT FACTOR
    ========================= */

    static calculateProfitFactor() {

        let grossProfit = 0;

        let grossLoss = 0;

        PortfolioState.tradeHistory
        .forEach(trade => {

            if (trade.pnl > 0) {

                grossProfit +=
                    trade.pnl;

            } else {

                grossLoss +=
                    Math.abs(
                        trade.pnl
                    );
            }
        });

        PortfolioState.profitFactor =

            grossLoss > 0

            ? (
                grossProfit /
                grossLoss
            ).toFixed(2)

            : grossProfit;
    }

    /* =========================
       MAX DRAWDOWN
    ========================= */

    static calculateDrawdown() {

        const equity =

            PortfolioState
            .portfolioValue;

        const peak =

            Math.max(
                PortfolioConfig
                .INITIAL_CAPITAL,

                equity
            );

        const drawdown =

            (
                (
                    peak - equity
                ) / peak
            ) * 100;

        PortfolioState.maxDrawdown =
            drawdown.toFixed(2);
    }

    /* =========================
       SHARPE RATIO
    ========================= */

    static calculateSharpeRatio() {

        const pnl =
            PortfolioState.totalPnL;

        const risk =
            PortfolioState.maxDrawdown || 1;

        PortfolioState.sharpeRatio =

            (
                pnl / risk
            ).toFixed(2);
    }

    /* =========================
       STRATEGY PERFORMANCE
    ========================= */

    static updateStrategyPerformance() {

        const performance = {};

        PortfolioState.tradeHistory
        .forEach(trade => {

            if (
                !performance[
                    trade.strategy
                ]
            ) {

                performance[
                    trade.strategy
                ] = 0;
            }

            performance[
                trade.strategy
            ] += trade.pnl || 0;
        });

        PortfolioState
        .strategyPerformance =
            performance;
    }

    /* =========================
       UI UPDATE
    ========================= */

    static updateUI() {

        const container =
            document.getElementById(
                "portfolioDashboard"
            );

        if (!container) return;

        container.innerHTML = `

            <div class="portfolio-card">

                <div class="portfolio-title">
                    AI PORTFOLIO
                </div>

                <div class="portfolio-value">
                    ₹${PortfolioState.portfolioValue.toFixed(2)}
                </div>

                <div class="
                    portfolio-pnl
                    ${
                        PortfolioState.totalPnL >= 0
                        ? "green"
                        : "red"
                    }
                ">

                    PnL:
                    ₹${PortfolioState.totalPnL.toFixed(2)}

                </div>

                <div>
                    Win Rate:
                    ${PortfolioState.winRate}%
                </div>

                <div>
                    Profit Factor:
                    ${PortfolioState.profitFactor}
                </div>

                <div>
                    Sharpe Ratio:
                    ${PortfolioState.sharpeRatio}
                </div>

                <div>
                    Max Drawdown:
                    ${PortfolioState.maxDrawdown}%
                </div>

                <div>
                    Total Trades:
                    ${PortfolioState.totalTrades}
                </div>

            </div>
        `;

        this.renderTradeHistory();

        this.renderStrategyPerformance();
    }

    /* =========================
       TRADE HISTORY UI
    ========================= */

    static renderTradeHistory() {

        const container =
            document.getElementById(
                "tradeHistory");

        if (!container) return;

        container.innerHTML = "";

        PortfolioState.tradeHistory
        .slice(-20)
        .reverse()
        .forEach(trade => {

            container.innerHTML += `

                <div class="
                    trade-history-card
                    ${
                        trade.pnl >= 0
                        ? "green"
                        : "red"
                    }
                ">

                    <div>
                        ${trade.symbol}
                    </div>

                    <div>
                        ${trade.strategy}
                    </div>

                    <div>
                        PnL:
                        ₹${trade.pnl?.toFixed(2)}
                    </div>

                    <div>
                        Qty:
                        ${trade.quantity}
                    </div>

                </div>
            `;
        });
    }

    /* =========================
       STRATEGY UI
    ========================= */

    static renderStrategyPerformance() {

        const container =
            document.getElementById(
                "strategyPerformance"
            );

        if (!container) return;

        container.innerHTML = "";

        Object.entries(
            PortfolioState
            .strategyPerformance
        ).forEach(([strategy, pnl]) => {

            container.innerHTML += `

                <div class="
                    strategy-performance-card
                    ${
                        pnl >= 0
                        ? "green"
                        : "red"
                    }
                ">

                    <div>
                        ${strategy}
                    </div>

                    <div>
                        ₹${pnl.toFixed(2)}
                    </div>

                </div>
            `;
        });
    }
}

/* =========================================
   PORTFOLIO ANALYTICS
========================================= */

class PortfolioAnalytics {

    static getBestStrategy() {

        const entries =
            Object.entries(
                PortfolioState
                .strategyPerformance
            );

        if (entries.length === 0) {

            return null;
        }

        return entries.sort(
            (a, b) =>
                b[1] - a[1]
        )[0];
    }

    static getWorstStrategy() {

        const entries =
            Object.entries(
                PortfolioState
                .strategyPerformance
            );

        if (entries.length === 0) {

            return null;
        }

        return entries.sort(
            (a, b) =>
                a[1] - b[1]
        )[0];
    }
}

/* =========================================
   AUTO INITIALIZE
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        PortfolioEngine.initialize();
    }
);

/* =========================================
   EXPORTS
========================================= */

window.TradeFinderPortfolio = {

    PortfolioEngine,

    PortfolioState,

    PortfolioAnalytics
};

console.log(
    "Institutional Portfolio Engine Ready"
);