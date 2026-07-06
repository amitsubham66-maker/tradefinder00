/* =========================================
   TRADEFINDER AI - PORTFOLIO MANAGER
========================================= */

import RiskManager from "../risk/riskManager.js";

/* =========================================
   PORTFOLIO STATE
========================================= */

const PortfolioState = {

    users: new Map()
};

/* =========================================
   PORTFOLIO MANAGER
========================================= */

class PortfolioManager {

    /* =====================================
       CREATE PORTFOLIO
    ===================================== */

    static createPortfolio(

        userId,

        initialCapital = 100000

    ) {

        try {

            if (

                PortfolioState.users.has(userId)

            ) {

                return PortfolioState
                .users.get(userId);
            }

            const portfolio = {

                userId,

                capital:
                    initialCapital,

                initialCapital,

                holdings: [],

                positions: [],

                realizedPnL: 0,

                unrealizedPnL: 0,

                exposure: 0,

                createdAt:
                    new Date()
            };

            PortfolioState.users.set(

                userId,

                portfolio
            );

            console.log(`
=========================================
PORTFOLIO CREATED
=========================================
`);

            return portfolio;

        }

        catch (error) {

            console.error(`
=========================================
PORTFOLIO CREATE ERROR
=========================================
`);

            return null;
        }
    }

    /* =====================================
       ADD POSITION
    ===================================== */

    static addPosition(

        userId,

        trade

    ) {

        try {

            const portfolio =
                PortfolioState.users.get(
                    userId
                );

            if (!portfolio) {

                return {

                    success: false
                };
            }

            portfolio.positions.push({

                symbol:
                    trade.symbol,

                side:
                    trade.side,

                quantity:
                    trade.quantity,

                entryPrice:
                    trade.entryPrice,

                currentPrice:
                    trade.entryPrice,

                sector:
                    trade.sector || "GENERAL",

                pnl: 0,

                createdAt:
                    new Date()
            });

            /* =====================
               UPDATE EXPOSURE
            ===================== */

            portfolio.exposure +=

                trade.quantity *

                trade.entryPrice;

            console.log(`
=========================================
POSITION ADDED
=========================================
`);

            return {

                success: true
            };

        }

        catch (error) {

            console.error(`
=========================================
ADD POSITION ERROR
=========================================
`);

            return {

                success: false
            };
        }
    }

    /* =====================================
       UPDATE MARKET PRICE
    ===================================== */

    static updateMarketPrice(

        symbol,

        livePrice

    ) {

        try {

            for (

                const [

                    userId,

                    portfolio

                ]

                of PortfolioState.users

            ) {

                portfolio.positions
                .forEach(position => {

                    if (

                        position.symbol ===
                        symbol

                    ) {

                        position.currentPrice =
                            livePrice;

                        /* =====================
                           BUY POSITION
                        ===================== */

                        if (

                            position.side ===
                            "BUY"

                        ) {

                            position.pnl =

                                (

                                    livePrice -

                                    position.entryPrice

                                )

                                *

                                position.quantity;
                        }

                        /* =====================
                           SELL POSITION
                        ===================== */

                        else {

                            position.pnl =

                                (

                                    position.entryPrice -

                                    livePrice

                                )

                                *

                                position.quantity;
                        }
                    }
                });

                /* =====================
                   UPDATE UNREALIZED PNL
                ===================== */

                portfolio.unrealizedPnL =

                    portfolio.positions
                    .reduce(

                        (sum, pos) =>

                            sum + pos.pnl,

                        0
                    );
            }

        }

        catch (error) {

            console.error(`
=========================================
MARKET PRICE UPDATE ERROR
=========================================
`);

            console.error(error.message);
        }
    }

    /* =====================================
       CLOSE POSITION
    ===================================== */

    static closePosition(

        userId,

        symbol

    ) {

        try {

            const portfolio =
                PortfolioState.users.get(
                    userId
                );

            if (!portfolio) {

                return {

                    success: false
                };
            }

            const position =
                portfolio.positions.find(

                    pos =>

                        pos.symbol ===
                        symbol
                );

            if (!position) {

                return {

                    success: false
                };
            }

            /* =====================
               UPDATE REALIZED PNL
            ===================== */

            portfolio.realizedPnL +=
                position.pnl;

            /* =====================
               UPDATE CAPITAL
            ===================== */

            portfolio.capital +=
                position.pnl;

            /* =====================
               REMOVE POSITION
            ===================== */

            portfolio.positions =

                portfolio.positions.filter(

                    pos =>

                        pos.symbol !==
                        symbol
                );

            console.log(`
=========================================
POSITION CLOSED
=========================================
`);

            return {

                success: true,

                pnl:
                    position.pnl
            };

        }

        catch (error) {

            console.error(`
=========================================
CLOSE POSITION ERROR
=========================================
`);

            return {

                success: false
            };
        }
    }

    /* =====================================
       SECTOR EXPOSURE
    ===================================== */

    static calculateSectorExposure(

        userId

    ) {

        try {

            const portfolio =
                PortfolioState.users.get(
                    userId
                );

            if (!portfolio) {

                return {};
            }

            const sectors = {};

            portfolio.positions
            .forEach(position => {

                if (
                    !sectors[position.sector]
                ) {

                    sectors[position.sector] = 0;
                }

                sectors[position.sector] +=

                    position.quantity *

                    position.currentPrice;
            });

            return sectors;

        }

        catch (error) {

            console.error(`
=========================================
SECTOR EXPOSURE ERROR
=========================================
`);

            return {};
        }
    }

    /* =====================================
       PORTFOLIO RISK ANALYSIS
    ===================================== */

    static analyzeRisk(userId) {

        try {

            const portfolio =
                PortfolioState.users.get(
                    userId
                );

            if (!portfolio) {

                return {};
            }

            const exposurePercent =

                (

                    portfolio.exposure /

                    portfolio.capital

                ) * 100;

            let riskLevel =
                "LOW";

            if (exposurePercent > 80) {

                riskLevel =
                    "HIGH";
            }

            else if (
                exposurePercent > 50
            ) {

                riskLevel =
                    "MEDIUM";
            }

            return {

                exposure:
                    portfolio.exposure,

                exposurePercent:
                    Number(
                        exposurePercent
                        .toFixed(2)
                    ),

                riskLevel
            };

        }

        catch (error) {

            console.error(`
=========================================
RISK ANALYSIS ERROR
=========================================
`);

            return {};
        }
    }

    /* =====================================
       PERFORMANCE METRICS
    ===================================== */

    static getPerformanceMetrics(

        userId

    ) {

        try {

            const portfolio =
                PortfolioState.users.get(
                    userId
                );

            if (!portfolio) {

                return {};
            }

            const totalPnL =

                portfolio.realizedPnL +

                portfolio.unrealizedPnL;

            const roi =

                (

                    totalPnL /

                    portfolio.initialCapital

                ) * 100;

            const totalTrades =
                portfolio.positions.length;

            return {

                totalPnL:
                    Number(
                        totalPnL.toFixed(2)
                    ),

                roi:
                    Number(
                        roi.toFixed(2)
                    ),

                totalTrades,

                capital:
                    portfolio.capital
            };

        }

        catch (error) {

            console.error(`
=========================================
PERFORMANCE METRICS ERROR
=========================================
`);

            return {};
        }
    }

    /* =====================================
       AI CAPITAL ALLOCATION
    ===================================== */

    static optimizeAllocation(

        userId,

        opportunities

    ) {

        try {

            const portfolio =
                PortfolioState.users.get(
                    userId
                );

            if (!portfolio) {

                return [];
            }

            const totalConfidence =

                opportunities.reduce(

                    (sum, item) =>

                        sum + item.confidence,

                    0
                );

            return opportunities.map(

                opportunity => ({

                    symbol:
                        opportunity.symbol,

                    allocation:

                        (

                            opportunity.confidence /

                            totalConfidence

                        )

                        *

                        portfolio.capital
                })
            );

        }

        catch (error) {

            console.error(`
=========================================
ALLOCATION ERROR
=========================================
`);

            return [];
        }
    }

    /* =====================================
       GET PORTFOLIO
    ===================================== */

    static getPortfolio(userId) {

        return PortfolioState.users.get(
            userId
        );
    }
}

/* =========================================
   EXPORT
========================================= */

export default PortfolioManager;