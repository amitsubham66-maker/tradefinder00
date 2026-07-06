/* =========================================
   TRADEFINDER AI - LOGGING SERVICE
========================================= */

import fs from "fs";

import path from "path";

/* =========================================
   LOG DIRECTORY
========================================= */

const LOG_DIRECTORY =
    "./backend/logs";

/* =========================================
   CREATE LOG FOLDER
========================================= */

if (!fs.existsSync(LOG_DIRECTORY)) {

    fs.mkdirSync(

        LOG_DIRECTORY,

        {

            recursive: true
        }
    );
}

/* =========================================
   LOG FILES
========================================= */

const LOG_FILES = {

    trade:
        path.join(
            LOG_DIRECTORY,
            "trade.log"
        ),

    ai:
        path.join(
            LOG_DIRECTORY,
            "ai.log"
        ),

    error:
        path.join(
            LOG_DIRECTORY,
            "error.log"
        ),

    security:
        path.join(
            LOG_DIRECTORY,
            "security.log"
        ),

    performance:
        path.join(
            LOG_DIRECTORY,
            "performance.log"
        ),

    broker:
        path.join(
            LOG_DIRECTORY,
            "broker.log"
        ),

    audit:
        path.join(
            LOG_DIRECTORY,
            "audit.log"
        )
};

/* =========================================
   LOGGING SERVICE
========================================= */

class LoggingService {

    /* =====================================
       WRITE LOG
    ===================================== */

    static writeLog(

        file,

        message

    ) {

        try {

            const timestamp =
                new Date().toISOString();

            const logMessage =

                `[${timestamp}] ${message}\n`;

            fs.appendFileSync(

                file,

                logMessage
            );

        }

        catch (error) {

            console.error(`
=========================================
LOG WRITE ERROR
=========================================
`);

            console.error(error.message);
        }
    }

    /* =====================================
       TRADE LOG
    ===================================== */

    static logTrade(trade) {

        try {

            const message =

                `
TRADE EXECUTED

Symbol:
${trade.symbol}

Side:
${trade.side}

Quantity:
${trade.quantity}

Entry:
${trade.entryPrice}

PnL:
${trade.pnl}
`;

            this.writeLog(

                LOG_FILES.trade,

                message
            );

        }

        catch (error) {

            console.error(`
=========================================
TRADE LOG ERROR
=========================================
`);
        }
    }

    /* =====================================
       AI LOG
    ===================================== */

    static logAISignal(signal) {

        try {

            const message =

                `
AI SIGNAL

Symbol:
${signal.symbol}

Signal:
${signal.signal}

Strategy:
${signal.strategy}

Confidence:
${signal.confidence}
`;

            this.writeLog(

                LOG_FILES.ai,

                message
            );

        }

        catch (error) {

            console.error(`
=========================================
AI LOG ERROR
=========================================
`);
        }
    }

    /* =====================================
       ERROR LOG
    ===================================== */

    static logError(

        module,

        error

    ) {

        try {

            const message =

                `
MODULE:
${module}

ERROR:
${error.message}

STACK:
${error.stack}
`;

            this.writeLog(

                LOG_FILES.error,

                message
            );

        }

        catch (err) {

            console.error(`
=========================================
ERROR LOGGER FAILED
=========================================
`);
        }
    }

    /* =====================================
       SECURITY LOG
    ===================================== */

    static logSecurity(event) {

        try {

            const message =

                `
SECURITY EVENT

User:
${event.userId}

IP:
${event.ip}

Action:
${event.action}

Status:
${event.status}
`;

            this.writeLog(

                LOG_FILES.security,

                message
            );

        }

        catch (error) {

            console.error(`
=========================================
SECURITY LOG ERROR
=========================================
`);
        }
    }

    /* =====================================
       PERFORMANCE LOG
    ===================================== */

    static logPerformance(data) {

        try {

            const message =

                `
PERFORMANCE

API:
${data.api}

Latency:
${data.latency}ms

CPU:
${data.cpu}

Memory:
${data.memory}
`;

            this.writeLog(

                LOG_FILES.performance,

                message
            );

        }

        catch (error) {

            console.error(`
=========================================
PERFORMANCE LOG ERROR
=========================================
`);
        }
    }

    /* =====================================
       BROKER LOG
    ===================================== */

    static logBrokerExecution(order) {

        try {

            const message =

                `
BROKER EXECUTION

Broker:
${order.broker}

Symbol:
${order.symbol}

Status:
${order.status}

Order ID:
${order.orderId}
`;

            this.writeLog(

                LOG_FILES.broker,

                message
            );

        }

        catch (error) {

            console.error(`
=========================================
BROKER LOG ERROR
=========================================
`);
        }
    }

    /* =====================================
       AUDIT LOG
    ===================================== */

    static logAudit(event) {

        try {

            const message =

                `
AUDIT EVENT

Type:
${event.type}

User:
${event.userId}

Details:
${JSON.stringify(event.details)}
`;

            this.writeLog(

                LOG_FILES.audit,

                message
            );

        }

        catch (error) {

            console.error(`
=========================================
AUDIT LOG ERROR
=========================================
`);
        }
    }

    /* =====================================
       LOG ROTATION
    ===================================== */

    static rotateLogs() {

        try {

            const files =
                Object.values(LOG_FILES);

            files.forEach(file => {

                if (

                    fs.existsSync(file)

                ) {

                    const stats =
                        fs.statSync(file);

                    /* =====================
                       ROTATE > 10MB
                    ===================== */

                    if (

                        stats.size >

                        10 * 1024 * 1024

                    ) {

                        const archiveName =

                            `${file}.${Date.now()}`;

                        fs.renameSync(

                            file,

                            archiveName
                        );

                        fs.writeFileSync(
                            file,
                            ""
                        );

                        console.log(`
=========================================
LOG ROTATED
=========================================
`);
                    }
                }
            });

        }

        catch (error) {

            console.error(`
=========================================
LOG ROTATION ERROR
=========================================
`);
        }
    }

    /* =====================================
       GET LOG FILE
    ===================================== */

    static getLogFile(type) {

        return LOG_FILES[type];
    }
}

/* =========================================
   EXPORT
========================================= */

export default LoggingService;