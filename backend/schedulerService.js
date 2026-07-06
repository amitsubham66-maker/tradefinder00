/* =========================================
   TRADEFINDER AI - SCHEDULER SERVICE
========================================= */

import cron from "node-cron";

import InstitutionalScanner from "../scanner/institutionalScanner.js";

import AILearningEngine from "../ai/aiLearningEngine.js";

import MonitoringService from "./monitoringService.js";

import NotificationService from "./notificationService.js";

import AnalyticsEngine from "../analytics/analyticsEngine.js";

import TradeExecutionEngine from "../execution/tradeExecutionEngine.js";

import PortfolioManager from "../portfolio/portfolioManager.js";

import NSEService from "./nseService.js";

/* =========================================
   SCHEDULER SERVICE
========================================= */

class SchedulerService {

    /* =====================================
       START ALL SCHEDULERS
    ===================================== */

    static startAllSchedulers() {

        try {

            console.log(`
=========================================
STARTING ALL SCHEDULERS
=========================================
`);

            this.marketScannerScheduler();

            this.aiTrainingScheduler();

            this.optionsDataScheduler();

            this.healthMonitoringScheduler();

            this.dailyReportScheduler();

            this.databaseCleanupScheduler();

            this.marketSessionScheduler();

            this.riskManagementScheduler();

        }

        catch (error) {

            console.error(`
=========================================
SCHEDULER START ERROR
=========================================
`);

            console.error(error.message);
        }
    }

    /* =====================================
       MARKET SCANNER
    ===================================== */

    static marketScannerScheduler() {

        cron.schedule("*/15 * * * * *",

        async () => {

            try {

                console.log(`
=========================================
MARKET SCAN STARTED
=========================================
`);

                const stocks =
                    await NSEService
                    .getIntradayStocks();

                const opportunities =
                    await InstitutionalScanner
                    .scanMarket(stocks);

                /* =====================
                   EXECUTE BEST SIGNALS
                ===================== */

                for (

                    const signal of opportunities
                ) {

                    if (

                        signal.confidence >= 85

                    ) {

                        await NotificationService
                        .sendTelegramAlert(

                            `
🚀 HIGH CONFIDENCE SIGNAL

${signal.symbol}

${signal.signal}

Confidence:
${signal.confidence}%
`
                        );
                    }
                }

            }

            catch (error) {

                console.error(`
=========================================
MARKET SCANNER ERROR
=========================================
`);

                console.error(error.message);
            }

        });

        console.log(`
=========================================
MARKET SCANNER SCHEDULED
=========================================
`);
    }

    /* =====================================
       AI TRAINING SCHEDULER
    ===================================== */

    static aiTrainingScheduler() {

        cron.schedule("0 */6 * * *",

        async () => {

            try {

                console.log(`
=========================================
AI TRAINING STARTED
=========================================
`);

                const result =
                    await AILearningEngine
                    .trainModel();

                await NotificationService
                .sendTelegramAlert(

                    `
🧠 AI MODEL TRAINED

Version:
${result.modelData.version}
`
                );

            }

            catch (error) {

                console.error(`
=========================================
AI TRAINING ERROR
=========================================
`);

            }

        });

        console.log(`
=========================================
AI TRAINING SCHEDULED
=========================================
`);
    }

    /* =====================================
       OPTIONS DATA REFRESH
    ===================================== */

    static optionsDataScheduler() {

        cron.schedule("*/30 * * * * *",

        async () => {

            try {

                console.log(`
=========================================
OPTIONS DATA REFRESH
=========================================
`);

                await NSEService
                .refreshOptionsData();

            }

            catch (error) {

                console.error(`
=========================================
OPTIONS REFRESH ERROR
=========================================
`);

            }

        });

        console.log(`
=========================================
OPTIONS REFRESH SCHEDULED
=========================================
`);
    }

    /* =====================================
       HEALTH MONITORING
    ===================================== */

    static healthMonitoringScheduler() {

        cron.schedule("*/1 * * * *",

        async () => {

            try {

                console.log(`
=========================================
HEALTH MONITORING
=========================================
`);

                const report =
                    await MonitoringService
                    .generateReport();

                /* =====================
                   HIGH MEMORY ALERT
                ===================== */

                if (

                    report.system
                    .memoryUsage > 85

                ) {

                    await NotificationService
                    .sendTelegramAlert(

                        `
⚠️ HIGH MEMORY USAGE

${report.system.memoryUsage}%
`
                    );
                }

            }

            catch (error) {

                console.error(`
=========================================
HEALTH MONITOR ERROR
=========================================
`);

            }

        });

        console.log(`
=========================================
HEALTH MONITOR SCHEDULED
=========================================
`);
    }

    /* =====================================
       DAILY REPORT
    ===================================== */

    static dailyReportScheduler() {

        cron.schedule("0 16 * * 1-5",

        async () => {

            try {

                console.log(`
=========================================
DAILY REPORT GENERATION
=========================================
`);

                const analytics =
                    await AnalyticsEngine
                    .getDashboardAnalytics();

                await NotificationService
                .sendTelegramAlert(

                    `
📊 DAILY REPORT

Trades:
${analytics.overall.totalTrades}

Win Rate:
${analytics.overall.winRate}%

PnL:
₹${analytics.overall.totalPnL}
`
                );

            }

            catch (error) {

                console.error(`
=========================================
DAILY REPORT ERROR
=========================================
`);

            }

        });

        console.log(`
=========================================
DAILY REPORT SCHEDULED
=========================================
`);
    }

    /* =====================================
       DATABASE CLEANUP
    ===================================== */

    static databaseCleanupScheduler() {

        cron.schedule("0 2 * * 0",

        async () => {

            try {

                console.log(`
=========================================
DATABASE CLEANUP STARTED
=========================================
`);

                /* =====================
                   CLEAN TEMP CACHE
                ===================== */

                global.marketCache = {};

                console.log(`
=========================================
CACHE CLEARED
=========================================
`);

            }

            catch (error) {

                console.error(`
=========================================
DATABASE CLEANUP ERROR
=========================================
`);

            }

        });

        console.log(`
=========================================
DATABASE CLEANUP SCHEDULED
=========================================
`);
    }

    /* =====================================
       MARKET SESSION CONTROL
    ===================================== */

    static marketSessionScheduler() {

        /* =====================
           MARKET OPEN
        ===================== */

        cron.schedule("15 9 * * 1-5",

        async () => {

            console.log(`
=========================================
MARKET OPEN SESSION STARTED
=========================================
`);

            await NotificationService
            .sendTelegramAlert(

                "🚀 MARKET OPEN"
            );
        });

        /* =====================
           MARKET CLOSE
        ===================== */

        cron.schedule("30 15 * * 1-5",

        async () => {

            console.log(`
=========================================
MARKET CLOSED
=========================================
`);

            await NotificationService
            .sendTelegramAlert(

                "📉 MARKET CLOSED"
            );
        });

        console.log(`
=========================================
MARKET SESSION CONTROL ACTIVE
=========================================
`);
    }

    /* =====================================
       RISK MANAGEMENT SCHEDULER
    ===================================== */

    static riskManagementScheduler() {

        cron.schedule("*/20 * * * * *",

        async () => {

            try {

                console.log(`
=========================================
RISK MANAGEMENT CHECK
=========================================
`);

                /* =====================
                   CHECK PORTFOLIOS
                ===================== */

                // Add dynamic user loop later

                const risk =
                    PortfolioManager
                    .analyzeRisk("DEMO_USER");

                if (

                    risk.riskLevel === "HIGH"

                ) {

                    await NotificationService
                    .sendTelegramAlert(

                        `
⚠️ HIGH RISK DETECTED

Exposure:
${risk.exposurePercent}%
`
                    );
                }

            }

            catch (error) {

                console.error(`
=========================================
RISK MANAGEMENT ERROR
=========================================
`);

            }

        });

        console.log(`
=========================================
RISK MANAGEMENT SCHEDULED
=========================================
`);
    }
}

/* =========================================
   EXPORT
========================================= */

export default SchedulerService;