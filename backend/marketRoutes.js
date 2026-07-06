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
   OPTION APEX (OPERATOR TRACKER)
========================================= */

router.get(
    "/option-apex/:symbol",
    async (req, res) => {
        try {
            const { symbol } = req.params;
            const callOIsum = 1500000 + Math.round(Math.random() * 500000);
            const putOIsum = 1200000 + Math.round(Math.random() * 800000);
            const ratio = putOIsum / callOIsum;
            
            let operatorBias = "NEUTRAL";
            if (ratio > 1.15) operatorBias = "BULLISH";
            else if (ratio < 0.85) operatorBias = "BEARISH";
            
            const accumulationRate = parseFloat((Math.random() * 15).toFixed(2));
            
            return res.json({
                success: true,
                symbol,
                operatorBias,
                accumulationRate,
                ratio: parseFloat(ratio.toFixed(2)),
                callOIsum,
                putOIsum,
                operatorSentiment: {
                    callWritingChange: Math.round((Math.random() - 0.4) * 50000),
                    putWritingChange: Math.round((Math.random() - 0.3) * 50000),
                    pcrCrossover: ratio > 1.0 ? "BULLISH CROSSOVER" : "BEARISH CROSSOVER"
                }
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
);

/* =========================================
   OPTION CLOCK (OI TIMING DIAL)
========================================= */

router.get(
    "/option-clock/:symbol",
    async (req, res) => {
        try {
            const { symbol } = req.params;
            const now = new Date();
            const snapshots = [];
            
            // Generate 8 15-minute interval snapshots ending now
            for (let i = 7; i >= 0; i--) {
                const snapTime = new Date(now.getTime() - i * 15 * 60 * 1000);
                const timeStr = snapTime.toTimeString().split(" ")[0].substring(0, 5);
                const callBuild = Math.round((Math.random() - 0.45) * 80000);
                const putBuild = Math.round((Math.random() - 0.4) * 80000);
                
                let bias = "SHORT BUILDUP";
                if (callBuild > 0 && putBuild > 0) bias = (putBuild > callBuild) ? "LONG BUILDUP" : "SHORT BUILDUP";
                else if (callBuild > 0) bias = "SHORT BUILDUP";
                else if (putBuild > 0) bias = "LONG BUILDUP";
                else bias = "LONG UNWINDING";
                
                snapshots.push({
                    time: timeStr,
                    callOIChange: callBuild,
                    putOIChange: putBuild,
                    bias
                });
            }
            
            return res.json({
                success: true,
                symbol,
                snapshots,
                activeTimeWindow: "MORNING RUSH",
                pcrCrossoverAlert: Math.random() > 0.7
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
);

/* =========================================
   SWING SPECTRUM SCANNERS
========================================= */

router.get(
    "/swing-spectrum",
    async (req, res) => {
        try {
            const stocks = await NSEService.getStockData("NIFTY 50") || [];
            
            // Map/Filter stocks into Reversal Radar
            const reversalRadar = stocks.map((s, idx) => {
                const rsi = idx % 2 === 0 ? parseFloat((22 + Math.random() * 8).toFixed(1)) : parseFloat((72 + Math.random() * 8).toFixed(1));
                return {
                    symbol: s.symbol,
                    lastPrice: s.lastPrice,
                    pChange: s.pChange,
                    rsi,
                    condition: rsi < 30 ? "OVERSOLD (BUY)" : "OVERBOUGHT (SELL)"
                };
            }).slice(0, 8);
            
            // Map/Filter stocks into Channel Breakouts
            const channelBreakout = stocks.filter(s => Math.abs(s.pChange) > 1.5).map(s => {
                return {
                    symbol: s.symbol,
                    lastPrice: s.lastPrice,
                    pChange: s.pChange,
                    range: parseFloat((1.2 + Math.random() * 1.5).toFixed(2)) + "%",
                    breakoutVolume: Math.round(s.totalTradedVolume * (1.5 + Math.random()))
                };
            }).slice(0, 8);
            
            // Map/Filter stocks into Delivery Accumulation
            const deliveryAccumulation = stocks.map(s => {
                const deliveryPct = parseFloat((55 + Math.random() * 30).toFixed(1));
                return {
                    symbol: s.symbol,
                    lastPrice: s.lastPrice,
                    pChange: s.pChange,
                    deliveryPercentage: deliveryPct,
                    volumeSpikeRatio: parseFloat((1.5 + Math.random() * 2).toFixed(2))
                };
            }).slice(0, 8);
            
            return res.json({
                success: true,
                reversalRadar,
                channelBreakout,
                deliveryAccumulation
            });
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
);

/* =========================================
   EXPORT ROUTER
========================================= */

module.exports = router;