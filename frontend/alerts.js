/* =========================================
   TRADEFINDER AI - ALERT ENGINE
========================================= */

console.log(`
=========================================
ALERT ENGINE INITIALIZED
Realtime Notifications Active
=========================================
`);

/* =========================================
   ALERT CONFIG
========================================= */

const AlertConfig = {

    ENABLE_SOUND: true,

    ENABLE_BROWSER_PUSH: true,

    ENABLE_TELEGRAM: false,

    ENABLE_DISCORD: false,

    ENABLE_EMAIL: false,

    ALERT_INTERVAL: 3000,

    HIGH_PRIORITY_CONFIDENCE: 90
};

/* =========================================
   ALERT STATE
========================================= */

const AlertState = {

    sentAlerts: [],

    notificationPermission: false
};

/* =========================================
   MAIN ALERT ENGINE
========================================= */

class AlertEngine {

    /* =========================
       INITIALIZE
    ========================= */

    static async initialize() {

        console.log(
            "Alert Engine Started"
        );

        await this.requestPermission();

        this.startRealtimeAlerts();
    }

    /* =========================
       PERMISSION
    ========================= */

    static async requestPermission() {

        if (
            "Notification" in window
        ) {

            const permission =
                await Notification
                .requestPermission();

            AlertState
            .notificationPermission =

                permission === "granted";
        }
    }

    /* =========================
       REALTIME LOOP
    ========================= */

    static startRealtimeAlerts() {

        setInterval(() => {

            this.checkStrategySignals();

        }, AlertConfig.ALERT_INTERVAL);
    }

    /* =========================
       CHECK SIGNALS
    ========================= */

    static checkStrategySignals() {

        const signals =
            TradeFinderStrategy
            .StrategyState
            .activeSignals;

        signals.forEach(signal => {

            const exists =
                AlertState.sentAlerts
                .find(
                    a =>
                        a.symbol ===
                        signal.symbol
                );

            if (!exists) {

                this.sendAlert(signal);

                AlertState.sentAlerts
                .push({

                    symbol:
                        signal.symbol,

                    timestamp:
                        Date.now()
                });
            }
        });
    }

    /* =========================
       SEND ALERT
    ========================= */

    static sendAlert(signal) {

        console.log(
            `
            ALERT:
            ${signal.symbol}
            ${signal.signal}
            `
        );

        this.showBrowserNotification(
            signal
        );

        this.playAlertSound(
            signal
        );

        this.showInAppAlert(
            signal
        );

        this.sendTelegramAlert(
            signal
        );

        this.sendDiscordAlert(
            signal
        );
    }

    /* =========================
       BROWSER PUSH
    ========================= */

    static showBrowserNotification(
        signal
    ) {

        if (

            !AlertConfig
            .ENABLE_BROWSER_PUSH ||

            !AlertState
            .notificationPermission

        ) {

            return;
        }

        new Notification(

            `${signal.signal} SIGNAL`,

            {

                body: `
                ${signal.symbol}
                Entry: ₹${signal.entry}
                Target: ₹${signal.target}
                Confidence:
                ${signal.confidence}%
                `,

                icon:
                    "/assets/logo.png"
            }
        );
    }

    /* =========================
       SOUND ALERTS
    ========================= */

    static playAlertSound(signal) {

        if (
            !AlertConfig
            .ENABLE_SOUND
        ) {

            return;
        }

        const audio =
            new Audio(

                signal.signal === "BUY"

                ? "/assets/buy.mp3"

                : "/assets/sell.mp3"
            );

        audio.play();
    }

    /* =========================
       IN-APP ALERTS
    ========================= */

    static showInAppAlert(signal) {

        const container =
            document.getElementById(
                "alertsContainer"
            );

        if (!container) return;

        const alert =
            document.createElement("div");

        alert.className = `
            ai-alert
            ${
                signal.signal ===
                "BUY"

                ? "bullish"

                : "bearish"
            }
        `;

        alert.innerHTML = `

            <div class="alert-header">

                🚨 ${signal.signal}

            </div>

            <div class="alert-body">

                <div>
                    ${signal.symbol}
                </div>

                <div>
                    Entry:
                    ₹${signal.entry}
                </div>

                <div>
                    Target:
                    ₹${signal.target}
                </div>

                <div>
                    SL:
                    ₹${signal.stopLoss}
                </div>

                <div>
                    Confidence:
                    ${signal.confidence}%
                </div>

            </div>
        `;

        container.prepend(alert);

        setTimeout(() => {

            alert.remove();

        }, 10000);
    }

    /* =========================
       TELEGRAM ALERTS
    ========================= */

    static async sendTelegramAlert(
        signal
    ) {

        if (
            !AlertConfig
            .ENABLE_TELEGRAM
        ) {

            return;
        }

        try {

            console.log(
                `
                Telegram Alert Sent:
                ${signal.symbol}
                `
            );

        } catch (error) {

            console.error(
                "Telegram Error:",
                error
            );
        }
    }

    /* =========================
       DISCORD ALERTS
    ========================= */

    static async sendDiscordAlert(
        signal
    ) {

        if (
            !AlertConfig
            .ENABLE_DISCORD
        ) {

            return;
        }

        try {

            console.log(
                `
                Discord Alert Sent:
                ${signal.symbol}
                `
            );

        } catch (error) {

            console.error(
                "Discord Error:",
                error
            );
        }
    }

    /* =========================
       PRIORITY ENGINE
    ========================= */

    static getPriority(signal) {

        if (

            signal.confidence >=

            AlertConfig
            .HIGH_PRIORITY_CONFIDENCE

        ) {

            return "HIGH";
        }

        if (
            signal.confidence >= 80
        ) {

            return "MEDIUM";
        }

        return "LOW";
    }
}

/* =========================================
   SMART MONEY ALERTS
========================================= */

class SmartMoneyAlerts {

    static monitor() {

        const stocks =
            TradeFinderScanner
            .ScannerState
            .smartMoneyStocks;

        stocks.forEach(stock => {

            console.log(
                `
                Smart Money Detected:
                ${stock.symbol}
                `
            );
        });
    }
}

/* =========================================
   AUTO INITIALIZE
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        AlertEngine.initialize();
    }
);

/* =========================================
   EXPORTS
========================================= */

window.TradeFinderAlerts = {

    AlertEngine,

    AlertState,

    SmartMoneyAlerts
};

console.log(
    "Institutional Alert Engine Ready"
);