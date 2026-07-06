/* =========================================
   TRADEFINDER AI - MARKET ROUTES
========================================= */





const express = require("express");

const NSEService = require("./nseService").default;
console.log("MARKET ROUTE NSEService");
console.log(typeof NSEService);
console.log(Object.getOwnPropertyNames(NSEService));

const router = express.Router();

/* =========================================
   MARKET STATUS
========================================= */

router.get(

    "/status",

    async (req, res) => {

        try {

            const status =
                await NSEService
                .getMarketStatus();

            return res.json({

                success: true,

                market:
                    status
            });

        }

        catch (error) {

            console.error(`
=========================================
MARKET STATUS ERROR
=========================================
`);

            console.error(error.message);

            return res.status(500)
            .json({

                success: false,

                error:
                    error.message
            });
        }
    }
);

/* =========================================
   LIVE STOCK DATA
========================================= */

router.get(

    "/stocks/:index",

    async (req, res) => {

        try {

            const {

                index

            } = req.params;

            const stocks =
                await NSEService
                .getStockData(index);

            return res.json({

                success: true,

                index,

                stocks
            });

        }

        catch (error) {

            console.error(`
=========================================
STOCK DATA ERROR
=========================================
`);

            console.error(error.message);

            return res.status(500)
            .json({

                success: false,

                error:
                    error.message
            });
        }
    }
);

/* =========================================
   OPTION CHAIN
========================================= */

router.get(

    "/options/:symbol",

    async (req, res) => {

        try {

            const {

                symbol

            } = req.params;

            const optionChain =
                await NSEService
                .getOptionChain(symbol);

            return res.json({

                success: true,

                symbol,

                optionChain
            });

        }

        catch (error) {

            console.error(`
=========================================
OPTION CHAIN ERROR
=========================================
`);

            console.error(error.message);

            return res.status(500)
            .json({

                success: false,

                error:
                    error.message
            });
        }
    }
);

/* =========================================
   PCR ANALYSIS
========================================= */

router.get(

    "/pcr/:symbol",

    async (req, res) => {

        try {

            const {

                symbol

            } = req.params;

            const pcr =
                await NSEService
                .getPCR(symbol);

            return res.json({

                success: true,

                pcr
            });

        }

        catch (error) {

            console.error(`
=========================================
PCR ERROR
=========================================
`);

            console.error(error.message);

            return res.status(500)
            .json({

                success: false,

                error:
                    error.message
            });
        }
    }
);

/* =========================================
   MARKET BREADTH
========================================= */

router.get(

    "/breadth",

    async (req, res) => {

        try {

            const breadth =
                await NSEService
                .getMarketBreadth();

            return res.json({

                success: true,

                breadth
            });

        }

        catch (error) {

            console.error(`
=========================================
BREADTH ERROR
=========================================
`);

            console.error(error.message);

            return res.status(500)
            .json({

                success: false,

                error:
                    error.message
            });
        }
    }
);

/* =========================================
   SMART MONEY FLOW
========================================= */

router.get(

    "/smart-money",

    async (req, res) => {

        try {

            const smartMoney =
                await NSEService
                .getSmartMoneyFlow();

            return res.json({

                success: true,

                smartMoney
            });

        }

        catch (error) {

            console.error(`
=========================================
SMART MONEY ERROR
=========================================
`);

            console.error(error.message);

            return res.status(500)
            .json({

                success: false,

                error:
                    error.message
            });
        }
    }
);

/* =========================================
   INTRADAY ANALYSIS
========================================= */

router.get(

    "/intraday/:symbol",

    async (req, res) => {

        try {

            const {

                symbol

            } = req.params;

            const analysis =
                await NSEService
                .getIntradayAnalysis(symbol);

            return res.json({

                success: true,

                analysis
            });

        }

        catch (error) {

            console.error(`
=========================================
INTRADAY ANALYSIS ERROR
=========================================
`);

            console.error(error.message);

            return res.status(500)
            .json({

                success: false,

                error:
                    error.message
            });
        }
    }
);

/* =========================================
   LIVE SCANNER
========================================= */

router.get(

    "/scanner",

    async (req, res) => {

        try {

            const stocks =
                await NSEService
                .getStockData();

            const breakouts =
                stocks.filter(

                    stock =>

                        stock.pChange > 2 &&

                        stock.totalTradedVolume >
                        1000000
                );

            return res.json({

                success: true,

                total:
                    breakouts.length,

                breakouts
            });

        }

        catch (error) {

            console.error(`
=========================================
SCANNER ERROR
=========================================
`);

            console.error(error.message);

            return res.status(500)
            .json({

                success: false,

                error:
                    error.message
            });
        }
    }
);

/* =========================================
   MARKET HEATMAP
========================================= */

router.get(

    "/heatmap",

    async (req, res) => {

        try {

            const stocks =
                await NSEService
                .getStockData();

            const heatmap =
                stocks.map(stock => ({

                    symbol:
                        stock.symbol,

                    change:
                        stock.pChange,

                    volume:
                        stock.totalTradedVolume,

                    bullish:
                        stock.pChange > 0
                }));

            return res.json({

                success: true,

                heatmap
            });

        }

        catch (error) {

            console.error(`
=========================================
HEATMAP ERROR
=========================================
`);

            console.error(error.message);

            return res.status(500)
            .json({

                success: false,

                error:
                    error.message
            });
        }
    }
);

/* =========================================
   TOP GAINERS
========================================= */

router.get(

    "/gainers",

    async (req, res) => {

        try {

            const stocks =
                await NSEService
                .getStockData();

            const gainers =
                stocks

                .sort(

                    (a, b) =>

                        b.pChange -
                        a.pChange
                )

                .slice(0, 10);

            return res.json({

                success: true,

                gainers
            });

        }

        catch (error) {

            console.error(`
=========================================
GAINERS ERROR
=========================================
`);

            console.error(error.message);

            return res.status(500)
            .json({

                success: false,

                error:
                    error.message
            });
        }
    }
);

/* =========================================
   TOP LOSERS
========================================= */

router.get(

    "/losers",

    async (req, res) => {

        try {

            const stocks =
                await NSEService
                .getStockData();

            const losers =
                stocks

                .sort(

                    (a, b) =>

                        a.pChange -
                        b.pChange
                )

                .slice(0, 10);

            return res.json({

                success: true,

                losers
            });

        }

        catch (error) {

            console.error(`
=========================================
LOSERS ERROR
=========================================
`);

            console.error(error.message);

            return res.status(500)
            .json({

                success: false,

                error:
                    error.message
            });
        }
    }
);

/* =========================================
   EXPORT ROUTER
========================================= */

module.exports = router;