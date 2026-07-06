/* =========================================
   TRADEFINDER AI - PORTFOLIO OPTIMIZATION
========================================= */

import LoggingService from "../services/loggingService.js";

import RedisService from "../services/redisService.js";

import RiskManagementEngine from "../risk/riskManagementEngine.js";

import WebsocketCluster from "../websocket/websocketCluster.js";

/* =========================================
   PORTFOLIO CONFIG
========================================= */

const PortfolioConfig = {

    MAX_SECTOR_EXPOSURE: 30,

    MAX_SINGLE_POSITION: 15,

    REBALANCE_THRESHOLD: 10,

    MIN_DIVERSIFICATION_SCORE: 60
};

/* =========================================
   PORTFOLIO OPTIMIZATION ENGINE
========================================= */

class PortfolioOptimizationEngine {

    /* =====================================
       OPTIMIZE PORTFOLIO
    ===================================== */

    static async optimizePortfolio(

        portfolio,

        aiSignals,

        capital

    ) {

        try {

            /* =============================
               SORT AI SIGNALS
            ============================= */

            const sortedSignals =

                [...aiSignals]

                .sort(

                    (a, b) =>

                        b.confidence -
                        a.confidence
                );

            const optimizedPositions = [];

            const sectorExposure = {};

            let allocatedCapital = 0;

            /* =============================
               CAPITAL ALLOCATION
            ============================= */

            for (

                const signal of sortedSignals

            ) {

                /* =========================
                   RISK VALIDATION
                ========================= */

                const riskEvaluation =

                    await RiskManagementEngine
                    .evaluateTradeRisk(

                        signal,

                        portfolio,

                        capital
                    );

                if (

                    !riskEvaluation.approved

                ) {

                    continue;
                }

                /* =========================
                   VOLATILITY WEIGHT
                ========================= */

                const volatilityFactor =

                    signal.marketRegime ===
                    "HIGH_VOLATILITY"

                    ?

                    0.5

                    :

                    1;

                /* =========================
                   CONFIDENCE WEIGHT
                ========================= */

                const confidenceWeight =

                    signal.confidence / 100;

                /* =========================
                   ALLOCATION %
                ========================= */

                let allocationPercent =

                    confidenceWeight *

                    10 *

                    volatilityFactor;

                allocationPercent = Math.min(

                    allocationPercent,

                    PortfolioConfig
                    .MAX_SINGLE_POSITION
                );

                /* =========================
                   SECTOR LIMIT
                ========================= */

                const sector =
                    signal.sector ||
                    "UNKNOWN";

                sectorExposure[sector] =

                    sectorExposure[sector] || 0;

                if (

                    sectorExposure[sector] +

                    allocationPercent >

                    PortfolioConfig
                    .MAX_SECTOR_EXPOSURE

                ) {

                    continue;
                }

                /* =========================
                   CAPITAL ALLOCATION
                ========================= */

                const allocationCapital =

                    (

                        capital *

                        allocationPercent

                    ) / 100;

                allocatedCapital +=
                    allocationCapital;

                sectorExposure[sector] +=
                    allocationPercent;

                /* =========================
                   POSITION SIZE
                ========================= */

                const quantity = Math.floor(

                    allocationCapital /

                    signal.entry
                );

                optimizedPositions.push({

                    symbol:
                        signal.symbol,

                    signal:
                        signal.signal,

                    confidence:
                        signal.confidence,

                    allocationPercent:
                        Number(
                            allocationPercent
                            .toFixed(2)
                        ),

                    allocationCapital:
                        Number(
                            allocationCapital
                            .toFixed(2)
                        ),

                    quantity,

                    entry:
                        signal.entry,

                    target:
                        signal.target,

                    stoploss:
                        signal.stoploss,

                    sector
                });
            }

            /* =============================
               DIVERSIFICATION SCORE
            ============================= */

            const diversificationScore =

                this.calculateDiversificationScore(

                    sectorExposure
                );

            /* =============================
               FINAL PORTFOLIO
            ============================= */

            const optimizedPortfolio = {

                timestamp:
                    new Date(),

                totalCapital:
                    capital,

                allocatedCapital:
                    Number(
                        allocatedCapital
                        .toFixed(2)
                    ),

                remainingCapital:
                    Number(

                        (
                            capital -
                            allocatedCapital
                        ).toFixed(2)
                    ),

                diversificationScore,

                sectorExposure,

                positions:
                    optimizedPositions
            };

            /* =============================
               CACHE PORTFOLIO
            ============================= */

            await RedisService.set(

                "OPTIMIZED_PORTFOLIO",

                optimizedPortfolio,

                60
            );

            /* =============================
               BROADCAST
            ============================= */

            await WebsocketCluster
            .publishPortfolioUpdate({

                type:
                    "PORTFOLIO_OPTIMIZED",

                portfolio:
                    optimizedPortfolio
            });

            return optimizedPortfolio;

        }

        catch (error) {

            LoggingService.logError(

                "PORTFOLIO_OPTIMIZATION",

                error
            );

            return {};
        }
    }

    /* =====================================
       DIVERSIFICATION SCORE
    ===================================== */

    static calculateDiversificationScore(

        sectorExposure

    ) {

        try {

            const sectors =
                Object.keys(
                    sectorExposure
                ).length;

            const exposureValues =
                Object.values(
                    sectorExposure
                );

            const maxExposure =
                Math.max(
                    ...exposureValues,
                    0
                );

            let score =

                sectors * 20 -

                maxExposure;

            score = Math.max(

                0,

                Math.min(score, 100)
            );

            return Number(
                score.toFixed(2)
            );

        }

        catch (error) {

            LoggingService.logError(

                "DIVERSIFICATION_SCORE",

                error
            );

            return 0;
        }
    }

    /* =====================================
       REBALANCE CHECK
    ===================================== */

    static needsRebalancing(

        currentPortfolio,

        optimizedPortfolio

    ) {

        try {

            const difference = Math.abs(

                currentPortfolio
                .allocatedCapital -

                optimizedPortfolio
                .allocatedCapital
            );

            const differencePercent =

                (

                    difference /

                    currentPortfolio
                    .allocatedCapital

                ) * 100;

            return {

                rebalance:

                    differencePercent >

                    PortfolioConfig
                    .REBALANCE_THRESHOLD,

                differencePercent:
                    Number(
                        differencePercent
                        .toFixed(2)
                    )
            };

        }

        catch (error) {

            LoggingService.logError(

                "REBALANCE_CHECK",

                error
            );

            return {

                rebalance: false
            };
        }
    }

    /* =====================================
       PORTFOLIO HEALTH
    ===================================== */

    static analyzePortfolioHealth(

        portfolio

    ) {

        try {

            const sectorExposure = {};

            for (

                const position of
                portfolio.positions

            ) {

                const sector =
                    position.sector ||
                    "UNKNOWN";

                sectorExposure[sector] =

                    (

                        sectorExposure[
                            sector
                        ] || 0

                    ) +

                    position
                    .allocationPercent;
            }

            const diversificationScore =

                this.calculateDiversificationScore(

                    sectorExposure
                );

            return {

                healthy:

                    diversificationScore >=
                    PortfolioConfig
                    .MIN_DIVERSIFICATION_SCORE,

                diversificationScore,

                sectorExposure
            };

        }

        catch (error) {

            LoggingService.logError(

                "PORTFOLIO_HEALTH",

                error
            );

            return {

                healthy: false
            };
        }
    }
}

/* =========================================
   EXPORT
========================================= */

export default PortfolioOptimizationEngine;