/* =========================================
   TRADEFINDER AI - RISK ENGINE
========================================= */

console.log(`
=========================================
RISK ENGINE INITIALIZED
Institutional Risk Management Active
=========================================
`);

/* =========================================
   RISK CONFIGURATION
========================================= */

const RiskConfig = {

    ACCOUNT_BALANCE: 100000,

    MAX_RISK_PER_TRADE: 1,

    MAX_DAILY_LOSS: 3,

    MAX_DRAWDOWN: 10,

    MAX_OPEN_TRADES: 5,

    MIN_RISK_REWARD: 2,

    ENABLE_TRAILING_SL: true,

    ENABLE_AI_RISK: true
};

/* =========================================
   RISK STATE
========================================= */

const RiskState = {

    currentBalance:
        RiskConfig.ACCOUNT_BALANCE,

    dailyPnL: 0,

    drawdown: 0,

    openTrades: [],

    blockedTrading: false,

    totalRiskExposure: 0
};

/* =========================================
   MAIN RISK ENGINE
========================================= */

class RiskEngine {

    /* =========================
       INITIALIZE
    ========================= */

    static initialize() {

        console.log(
            "Risk Engine Started"
        );

        this.startMonitoring();
    }

    /* =========================
       MONITORING LOOP
    ========================= */

    static startMonitoring() {

        setInterval(() => {

            this.checkDailyLoss();

            this.checkDrawdown();

            this.updateTrailingSL();

            this.calculateExposure();

            this.updateUI();

        }, 3000);
    }

    /* =========================
       POSITION SIZE
    ========================= */

    static calculatePositionSize(

        entry,

        stopLoss

    ) {

        const riskAmount =

            (
                RiskState.currentBalance *

                RiskConfig
                .MAX_RISK_PER_TRADE
            ) / 100;

        const riskPerShare =

            Math.abs(
                entry - stopLoss
            );

        if (riskPerShare <= 0) {

            return 0;
        }

        const quantity =

            Math.floor(
                riskAmount /
                riskPerShare
            );

        return quantity;
    }

    /* =========================
       RISK REWARD
    ========================= */

    static calculateRiskReward(

        entry,

        stopLoss,

        target

    ) {

        const risk =

            Math.abs(
                entry - stopLoss
            );

        const reward =

            Math.abs(
                target - entry
            );

        if (risk === 0) {

            return 0;
        }

        return Number(
            (
                reward / risk
            ).toFixed(2)
        );
    }

    /* =========================
       VALIDATE TRADE
    ========================= */

    static validateTrade(signal) {

        if (
            RiskState.blockedTrading
        ) {

            return {

                valid: false,

                reason:
                    "Trading Blocked"
            };
        }

        if (

            RiskState.openTrades.length >=

            RiskConfig.MAX_OPEN_TRADES

        ) {

            return {

                valid: false,

                reason:
                    "Max Open Trades Reached"
            };
        }

        const rr =
            this.calculateRiskReward(

                signal.entry,

                signal.stopLoss,

                signal.target
            );

        if (

            rr <
            RiskConfig.MIN_RISK_REWARD

        ) {

            return {

                valid: false,

                reason:
                    "Low Risk Reward"
            };
        }

        return {

            valid: true,

            riskReward: rr
        };
    }

    /* =========================
       ADD TRADE
    ========================= */

    static addTrade(signal) {

        const quantity =

            this.calculatePositionSize(

                signal.entry,

                signal.stopLoss
            );

        const trade = {

            ...signal,

            quantity,

            pnl: 0,

            active: true,

            timestamp: Date.now()
        };

        RiskState.openTrades.push(
            trade
        );

        console.log(
            "Trade Added:",
            trade
        );

        return trade;
    }

    /* =========================
       DAILY LOSS CHECK
    ========================= */

    static checkDailyLoss() {

        const dailyLossPercent =

            (
                Math.abs(
                    RiskState.dailyPnL
                ) /

                RiskConfig.ACCOUNT_BALANCE
            ) * 100;

        if (

            RiskState.dailyPnL < 0 &&

            dailyLossPercent >=
            RiskConfig.MAX_DAILY_LOSS

        ) {

            RiskState.blockedTrading =
                true;

            console.warn(
                "Daily Loss Limit Hit"
            );
        }
    }

    /* =========================
       DRAWDOWN CHECK
    ========================= */

    static checkDrawdown() {

        const drawdownPercent =

            (
                (
                    RiskConfig
                    .ACCOUNT_BALANCE -

                    RiskState.currentBalance
                ) /

                RiskConfig
                .ACCOUNT_BALANCE
            ) * 100;

        RiskState.drawdown =
            drawdownPercent;

        if (

            drawdownPercent >=
            RiskConfig.MAX_DRAWDOWN

        ) {

            RiskState.blockedTrading =
                true;

            console.warn(
                "Max Drawdown Reached"
            );
        }
    }

    /* =========================
       TRAILING STOP LOSS
    ========================= */

    static updateTrailingSL() {

        if (
            !RiskConfig
            .ENABLE_TRAILING_SL
        ) {

            return;
        }

        RiskState.openTrades
        .forEach(trade => {

            const currentPrice =
                trade.entry +
                Math.random() * 20;

            const profit =
                currentPrice -
                trade.entry;

            if (profit > 10) {

                trade.stopLoss =
                    Math.max(

                        trade.stopLoss,

                        currentPrice - 5
                    );

                console.log(
                    `
                    Trailing SL Updated:
                    ${trade.symbol}
                    `
                );
            }
        });
    }

    /* =========================
       TOTAL EXPOSURE
    ========================= */

    static calculateExposure() {

        let totalExposure = 0;

        RiskState.openTrades
        .forEach(trade => {

            totalExposure +=

                trade.entry *
                trade.quantity;
        });

        RiskState.totalRiskExposure =
            totalExposure;
    }

    /* =========================
       AI RISK SCORE
    ========================= */

    static calculateAIRisk(signal) {

        let score = 100;

        if (
            signal.confidence < 80
        ) {

            score -= 20;
        }

        if (
            signal.strategy ===
            "SCALPING"
        ) {

            score -= 10;
        }

        if (
            TradeFinderOptions
            .OptionsState.ivState ===
            "HIGH_VOLATILITY"
        ) {

            score -= 20;
        }

        return Math.max(score, 0);
    }

    /* =========================
       UI UPDATE
    ========================= */

    static updateUI() {

        const container =
            document.getElementById(
                "riskDashboard"
            );

        if (!container) return;

        container.innerHTML = `

            <div class="risk-card">

                <div>
                    Balance:
                    ₹${RiskState.currentBalance}
                </div>

                <div>
                    Daily PnL:
                    ₹${RiskState.dailyPnL}
                </div>

                <div>
                    Drawdown:
                    ${RiskState.drawdown.toFixed(2)}%
                </div>

                <div>
                    Exposure:
                    ₹${RiskState.totalRiskExposure}
                </div>

                <div class="
                    ${
                        RiskState.blockedTrading
                        ? "red"
                        : "green"
                    }
                ">

                    ${
                        RiskState.blockedTrading
                        ? "TRADING BLOCKED"
                        : "ACTIVE"
                    }

                </div>

            </div>
        `;
    }
}

/* =========================================
   AUTO TRADE VALIDATOR
========================================= */

class TradeValidator {

    static validate(signal) {

        const validation =

            RiskEngine.validateTrade(
                signal
            );

        if (!validation.valid) {

            console.warn(
                `
                Trade Rejected:
                ${validation.reason}
                `
            );

            return false;
        }

        return true;
    }
}

/* =========================================
   AUTO INITIALIZE
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        RiskEngine.initialize();
    }
);

/* =========================================
   EXPORTS
========================================= */

window.TradeFinderRisk = {

    RiskEngine,

    RiskState,

    TradeValidator
};

console.log(
    "Institutional Risk Engine Ready"
);