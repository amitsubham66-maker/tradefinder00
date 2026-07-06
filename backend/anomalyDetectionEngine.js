/* =========================================
   TRADEFINDER AI - ANOMALY DETECTION
========================================= */

import LoggingService from "../services/loggingService.js";

import RedisService from "../services/redisService.js";

import WebsocketCluster from "../websocket/websocketCluster.js";

/* =========================================
   ANOMALY CONFIG
========================================= */

const AnomalyConfig = {

    MAX_PRICE_MOVE: 5,

    MAX_VOLUME_SPIKE: 3,

    MAX_SLIPPAGE: 1.5,

    MAX_LATENCY: 3000,

    MIN_AI_CONFIDENCE: 50
};

/* =========================================
   ANOMALY DETECTION ENGINE
========================================= */

class AnomalyDetectionEngine {

    /* =====================================
       MARKET ANOMALY
    ===================================== */

    static detectMarketAnomaly(

        marketData

    ) {

        try {

            const anomalies = [];

            /* =============================
               PRICE SPIKE
            ============================= */

            if (

                Math.abs(
                    marketData.priceChange
                ) >

                AnomalyConfig
                .MAX_PRICE_MOVE

            ) {

                anomalies.push({

                    type:
                        "PRICE_SPIKE",

                    severity:
                        "HIGH",

                    value:
                        marketData.priceChange
                });
            }

            /* =============================
               VOLUME SPIKE
            ============================= */

            const volumeRatio =

                marketData.volume /

                marketData.avgVolume;

            if (

                volumeRatio >

                AnomalyConfig
                .MAX_VOLUME_SPIKE

            ) {

                anomalies.push({

                    type:
                        "VOLUME_SPIKE",

                    severity:
                        "MEDIUM",

                    value:
                        Number(
                            volumeRatio
                            .toFixed(2)
                        )
                });
            }

            return anomalies;

        }

        catch (error) {

            LoggingService.logError(

                "MARKET_ANOMALY",

                error
            );

            return [];
        }
    }

    /* =====================================
       EXECUTION ANOMALY
    ===================================== */

    static detectExecutionAnomaly(

        execution

    ) {

        try {

            const anomalies = [];

            /* =============================
               SLIPPAGE
            ============================= */

            if (

                execution.slippage >

                AnomalyConfig
                .MAX_SLIPPAGE

            ) {

                anomalies.push({

                    type:
                        "HIGH_SLIPPAGE",

                    severity:
                        "HIGH",

                    value:
                        execution.slippage
                });
            }

            /* =============================
               LATENCY
            ============================= */

            if (

                execution.latency >

                AnomalyConfig
                .MAX_LATENCY

            ) {

                anomalies.push({

                    type:
                        "HIGH_LATENCY",

                    severity:
                        "MEDIUM",

                    value:
                        execution.latency
                });
            }

            return anomalies;

        }

        catch (error) {

            LoggingService.logError(

                "EXECUTION_ANOMALY",

                error
            );

            return [];
        }
    }

    /* =====================================
       AI SIGNAL ANOMALY
    ===================================== */

    static detectAISignalAnomaly(

        signal

    ) {

        try {

            const anomalies = [];

            if (

                signal.confidence <

                AnomalyConfig
                .MIN_AI_CONFIDENCE

            ) {

                anomalies.push({

                    type:
                        "LOW_AI_CONFIDENCE",

                    severity:
                        "LOW",

                    value:
                        signal.confidence
                });
            }

            if (

                signal.marketRegime ===
                "UNKNOWN"

            ) {

                anomalies.push({

                    type:
                        "UNKNOWN_MARKET_REGIME",

                    severity:
                        "MEDIUM"
                });
            }

            return anomalies;

        }

        catch (error) {

            LoggingService.logError(

                "AI_SIGNAL_ANOMALY",

                error
            );

            return [];
        }
    }

    /* =====================================
       GLOBAL ANOMALY ANALYSIS
    ===================================== */

    static async analyzeSystem(

        marketData,

        execution,

        aiSignal

    ) {

        try {

            const anomalies = [

                ...this.detectMarketAnomaly(
                    marketData
                ),

                ...this.detectExecutionAnomaly(
                    execution
                ),

                ...this.detectAISignalAnomaly(
                    aiSignal
                )
            ];

            /* =============================
               SEVERITY
            ============================= */

            const highSeverity =

                anomalies.filter(

                    anomaly =>

                        anomaly.severity ===
                        "HIGH"
                );

            const riskLevel =

                highSeverity.length >= 2

                ?

                "CRITICAL"

                :

                highSeverity.length === 1

                ?

                "HIGH"

                :

                anomalies.length > 0

                ?

                "MEDIUM"

                :

                "NORMAL";

            const report = {

                timestamp:
                    new Date(),

                riskLevel,

                anomalyCount:
                    anomalies.length,

                anomalies
            };

            /* =============================
               CACHE REPORT
            ============================= */

            await RedisService.set(

                "SYSTEM_ANOMALY_REPORT",

                report,

                300
            );

            /* =============================
               ALERT
            ============================= */

            if (

                riskLevel === "HIGH" ||

                riskLevel === "CRITICAL"

            ) {

                await WebsocketCluster
                .publishRiskAlert({

                    type:
                        "ANOMALY_DETECTED",

                    report
                });
            }

            return report;

        }

        catch (error) {

            LoggingService.logError(

                "GLOBAL_ANOMALY_ANALYSIS",

                error
            );

            return {

                riskLevel: "UNKNOWN"
            };
        }
    }

    /* =====================================
       AUTO RISK REDUCTION
    ===================================== */

    static async autoReduceRisk(

        anomalyReport

    ) {

        try {

            if (

                anomalyReport.riskLevel ===
                "CRITICAL"

            ) {

                await RedisService.set(

                    "AUTO_TRADING_DISABLED",

                    true,

                    3600
                );

                return {

                    action:
                        "AUTO_TRADING_DISABLED"
                };
            }

            if (

                anomalyReport.riskLevel ===
                "HIGH"

            ) {

                return {

                    action:
                        "REDUCE_POSITION_SIZE"
                };
            }

            return {

                action:
                    "NO_ACTION"
            };

        }

        catch (error) {

            LoggingService.logError(

                "AUTO_RISK_REDUCTION",

                error
            );

            return {

                action:
                    "ERROR"
            };
        }
    }
}

/* =========================================
   EXPORT
========================================= */

export default AnomalyDetectionEngine;