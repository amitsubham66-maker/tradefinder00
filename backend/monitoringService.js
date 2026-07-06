/* =========================================
   TRADEFINDER AI - MONITORING SERVICE
========================================= */

import os from "os";

import axios from "axios";

import mongoose from "mongoose";

import NotificationService from "./notificationService.js";

import AILearningEngine from "../ai/aiLearningEngine.js";

/* =========================================
   MONITOR STATE
========================================= */

const MonitorState = {

    apiStatus: {},

    websocketStatus: "CONNECTED",

    databaseStatus: "CONNECTED",

    aiStatus: "ACTIVE",

    lastHealthCheck: null
};

/* =========================================
   MONITORING SERVICE
========================================= */

class MonitoringService {

    /* =====================================
       SYSTEM HEALTH
    ===================================== */

    static getSystemHealth() {

        try {

            const totalMemory =
                os.totalmem();

            const freeMemory =
                os.freemem();

            const usedMemory =

                totalMemory -
                freeMemory;

            const memoryUsage =

                (

                    usedMemory /
                    totalMemory

                ) * 100;

            const cpuLoad =
                os.loadavg()[0];

            const uptime =
                os.uptime();

            return {

                platform:
                    os.platform(),

                cpuArchitecture:
                    os.arch(),

                cpuLoad:
                    Number(
                        cpuLoad.toFixed(2)
                    ),

                memoryUsage:
                    Number(
                        memoryUsage.toFixed(2)
                    ),

                uptime,

                totalMemory,

                freeMemory,

                usedMemory
            };

        }

        catch (error) {

            console.error(`
=========================================
SYSTEM HEALTH ERROR
=========================================
`);

            return {};
        }
    }

    /* =====================================
       API HEALTH CHECK
    ===================================== */

    static async checkAPIHealth() {

        try {

            const apis = [

                {
                    name: "NSE",

                    url:
                        "https://www.nseindia.com"
                },

                {
                    name: "Zerodha",

                    url:
                        "https://api.kite.trade"
                },

                {
                    name: "AngelOne",

                    url:
                        "https://apiconnect.angelone.in"
                }
            ];

            for (const api of apis) {

                try {

                    const start =
                        Date.now();

                    await axios.get(api.url);

                    const latency =
                        Date.now() - start;

                    MonitorState.apiStatus[
                        api.name
                    ] = {

                        status:
                            "ONLINE",

                        latency
                    };

                }

                catch (error) {

                    MonitorState.apiStatus[
                        api.name
                    ] = {

                        status:
                            "OFFLINE",

                        latency: -1
                    };

                    await NotificationService
                    .sendTelegramAlert(

                        `⚠️ API DOWN: ${api.name}`
                    );
                }
            }

            return MonitorState.apiStatus;

        }

        catch (error) {

            console.error(`
=========================================
API HEALTH ERROR
=========================================
`);

            return {};
        }
    }

    /* =====================================
       DATABASE HEALTH
    ===================================== */

    static async checkDatabaseHealth() {

        try {

            const state =
                mongoose.connection.readyState;

            if (state === 1) {

                MonitorState.databaseStatus =
                    "CONNECTED";
            }

            else {

                MonitorState.databaseStatus =
                    "DISCONNECTED";

                await NotificationService
                .sendTelegramAlert(

                    "🚨 DATABASE DISCONNECTED"
                );
            }

            return {

                status:
                    MonitorState.databaseStatus
            };

        }

        catch (error) {

            console.error(`
=========================================
DATABASE HEALTH ERROR
=========================================
`);

            return {

                status:
                    "ERROR"
            };
        }
    }

    /* =====================================
       AI ENGINE HEALTH
    ===================================== */

    static getAIHealth() {

        try {

            const aiStatus =
                AILearningEngine
                .getAIStatus();

            return {

                status:
                    MonitorState.aiStatus,

                version:
                    aiStatus.version,

                marketRegime:
                    aiStatus.marketRegime,

                confidence:
                    aiStatus.adaptiveConfidence,

                learningRate:
                    aiStatus.learningRate
            };

        }

        catch (error) {

            console.error(`
=========================================
AI HEALTH ERROR
=========================================
`);

            return {};
        }
    }

    /* =====================================
       WEBSOCKET MONITOR
    ===================================== */

    static monitorWebsocket(

        clientsCount

    ) {

        try {

            return {

                status:
                    MonitorState
                    .websocketStatus,

                connectedClients:
                    clientsCount
            };

        }

        catch (error) {

            console.error(`
=========================================
WEBSOCKET MONITOR ERROR
=========================================
`);

            return {};
        }
    }

    /* =====================================
       EXECUTION LATENCY
    ===================================== */

    static calculateExecutionLatency(

        startTime

    ) {

        try {

            return Date.now() - startTime;

        }

        catch (error) {

            return -1;
        }
    }

    /* =====================================
       AUTO RECOVERY
    ===================================== */

    static async autoRecovery(service) {

        try {

            console.log(`
=========================================
AUTO RECOVERY INITIATED
=========================================
`);

            switch (service) {

                case "DATABASE":

                    await mongoose.connect(

                        process.env.MONGO_URI
                    );

                    break;

                case "API":

                    await this.checkAPIHealth();

                    break;

                case "AI":

                    AILearningEngine
                    .initialize();

                    break;

                default:

                    console.log(
                        "UNKNOWN SERVICE"
                    );
            }

            await NotificationService
            .sendTelegramAlert(

                `✅ RECOVERY SUCCESS: ${service}`
            );

            return true;

        }

        catch (error) {

            console.error(`
=========================================
AUTO RECOVERY ERROR
=========================================
`);

            return false;
        }
    }

    /* =====================================
       COMPLETE MONITOR REPORT
    ===================================== */

    static async generateReport() {

        try {

            const system =
                this.getSystemHealth();

            const api =
                await this.checkAPIHealth();

            const database =
                await this.checkDatabaseHealth();

            const ai =
                this.getAIHealth();

            MonitorState.lastHealthCheck =
                new Date();

            return {

                timestamp:
                    MonitorState
                    .lastHealthCheck,

                system,

                api,

                database,

                ai
            };

        }

        catch (error) {

            console.error(`
=========================================
MONITOR REPORT ERROR
=========================================
`);

            return {};
        }
    }

    /* =====================================
       START MONITORING LOOP
    ===================================== */

    static startMonitoring() {

        try {

            console.log(`
=========================================
MONITORING SERVICE STARTED
=========================================
`);

            setInterval(async () => {

                const report =
                    await this.generateReport();

                console.log(`
=========================================
HEALTH REPORT GENERATED
=========================================
`);

                console.log(report);

            }, 60000);

        }

        catch (error) {

            console.error(`
=========================================
MONITORING LOOP ERROR
=========================================
`);
        }
    }
}

/* =========================================
   EXPORT
========================================= */

export default MonitoringService;