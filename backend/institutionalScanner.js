/* =========================================
   TRADEFINDER AI - INSTITUTIONAL SCANNER
========================================= */

import StrategyEngine from "../strategy/strategyEngine.js";

import AILearningEngine from "../ai/aiLearningEngine.js";

/* =========================================
   SCANNER CONFIG
========================================= */

const ScannerConfig = {

    MIN_VOLUME_RATIO: 2,

    MIN_OI_CHANGE: 10,

    MIN_CONFIDENCE: 75,

    LIQUIDITY_SWEEP_THRESHOLD: 0.8
};

/* =========================================
   SCANNER ENGINE
========================================= */

class InstitutionalScanner {

    /* =====================================
       MAIN MARKET SCANNER
    ===================================== */

    static async scanMarket(stocksData) {

        try {

            const opportunities = [];

            for (const stock of stocksData) {

                const analysis =
                    await this.scanStock(stock);

                if (analysis.valid) {

                    opportunities.push(
                        analysis
                    );
                }
            }

            /* =====================
               RANK OPPORTUNITIES
            ===================== */

            return opportunities.sort(

                (a, b) =>

                    b.confidence -
                    a.confidence
            );

        }

        catch (error) {

            console.error(`
=========================================
MARKET SCAN ERROR
=========================================
`);

            console.error(error.message);

            return [];
        }
    }

    /* =====================================
       SCAN SINGLE STOCK
    ===================================== */

    static async scanStock(stock) {

        try {

            const volumeAnalysis =
                this.detectVolumeExplosion(
                    stock
                );

            const oiAnalysis =
                this.detectOIBuildup(
                    stock
                );

            const liquidityAnalysis =
                this.detectLiquiditySweep(
                    stock
                );

            const optionsAnalysis =
                this.analyzeOptionsChain(
                    stock
                );

            const strategyAnalysis =
                StrategyEngine
                .analyzeMarket(stock);

            const bestStrategy =
                StrategyEngine
                .selectBestStrategy(
                    strategyAnalysis
                );

            /* =====================
               AI MARKET REGIME
            ===================== */

            const regime =
                AILearningEngine
                .detectMarketRegime(stock);

            /* =====================
               FINAL CONFIDENCE
            ===================== */

            let confidence =
                bestStrategy.confidence || 0;

            if (
                volumeAnalysis.detected
            ) confidence += 5;

            if (
                oiAnalysis.detected
            ) confidence += 5;

            if (
                liquidityAnalysis.detected
            ) confidence += 5;

            if (
                optionsAnalysis.detected
            ) confidence += 5;

            return {

                valid:

                    confidence >=
                    ScannerConfig
                    .MIN_CONFIDENCE,

                symbol:
                    stock.symbol,

                strategy:
                    bestStrategy.strategy,

                signal:
                    bestStrategy.signal,

                confidence,

                marketRegime:
                    regime,

                volumeExplosion:
                    volumeAnalysis,

                oiAnalysis,

                liquidityAnalysis,

                optionsAnalysis,

                timestamp:
                    new Date()
            };

        }

        catch (error) {

            console.error(`
=========================================
SCAN STOCK ERROR
=========================================
`);

            console.error(error.message);

            return {

                valid: false
            };
        }
    }

    /* =====================================
       VOLUME EXPLOSION DETECTION
    ===================================== */

    static detectVolumeExplosion(stock) {

        try {

            const volumes =
                stock.volume;

            const latestVolume =
                volumes.at(-1);

            const averageVolume =

                volumes.reduce(

                    (a, b) => a + b,

                    0
                )

                / volumes.length;

            const ratio =
                latestVolume /
                averageVolume;

            return {

                detected:

                    ratio >=
                    ScannerConfig
                    .MIN_VOLUME_RATIO,

                ratio:
                    Number(
                        ratio.toFixed(2)
                    ),

                latestVolume,

                averageVolume
            };

        }

        catch (error) {

            console.error(`
=========================================
VOLUME ANALYSIS ERROR
=========================================
`);

            return {

                detected: false
            };
        }
    }

    /* =====================================
       OI BUILDUP DETECTION
    ===================================== */

    static detectOIBuildup(stock) {

        try {

            const oiData =
                stock.oiData || [];

            if (oiData.length < 2) {

                return {

                    detected: false
                };
            }

            const latestOI =
                oiData.at(-1);

            const previousOI =
                oiData.at(-2);

            const oiChange =

                (

                    (

                        latestOI -
                        previousOI

                    )

                    /

                    previousOI

                ) * 100;

            let type =
                "NEUTRAL";

            if (oiChange > 0) {

                type =
                    "LONG_BUILDUP";
            }

            if (oiChange < 0) {

                type =
                    "SHORT_COVERING";
            }

            return {

                detected:

                    Math.abs(oiChange) >=

                    ScannerConfig
                    .MIN_OI_CHANGE,

                oiChange:
                    Number(
                        oiChange.toFixed(2)
                    ),

                type
            };

        }

        catch (error) {

            console.error(`
=========================================
OI ANALYSIS ERROR
=========================================
`);

            return {

                detected: false
            };
        }
    }

    /* =====================================
       LIQUIDITY SWEEP DETECTION
    ===================================== */

    static detectLiquiditySweep(stock) {

        try {

            const highs =
                stock.high;

            const lows =
                stock.low;

            const closes =
                stock.close;

            const latestClose =
                closes.at(-1);

            const latestHigh =
                highs.at(-1);

            const latestLow =
                lows.at(-1);

            let detected = false;

            let direction =
                "NONE";

            /* =====================
               STOP HUNT ABOVE
            ===================== */

            if (

                latestHigh >

                Math.max(...highs.slice(0, -1))

                &&

                latestClose < latestHigh

            ) {

                detected = true;

                direction =
                    "BEARISH_SWEEP";
            }

            /* =====================
               STOP HUNT BELOW
            ===================== */

            if (

                latestLow <

                Math.min(...lows.slice(0, -1))

                &&

                latestClose > latestLow

            ) {

                detected = true;

                direction =
                    "BULLISH_SWEEP";
            }

            return {

                detected,

                direction
            };

        }

        catch (error) {

            console.error(`
=========================================
LIQUIDITY SWEEP ERROR
=========================================
`);

            return {

                detected: false
            };
        }
    }

    /* =====================================
       OPTIONS CHAIN ANALYSIS
    ===================================== */

    static analyzeOptionsChain(stock) {

        try {

            const pcr =
                stock.pcr || 1;

            const iv =
                stock.iv || 0;

            const maxPain =
                stock.maxPain || 0;

            let signal =
                "NEUTRAL";

            let detected =
                false;

            if (pcr > 1.2) {

                signal =
                    "BULLISH_OPTIONS";

                detected = true;
            }

            if (pcr < 0.7) {

                signal =
                    "BEARISH_OPTIONS";

                detected = true;
            }

            return {

                detected,

                signal,

                pcr,

                iv,

                maxPain
            };

        }

        catch (error) {

            console.error(`
=========================================
OPTIONS ANALYSIS ERROR
=========================================
`);

            return {

                detected: false
            };
        }
    }

    /* =====================================
       TOP OPPORTUNITIES
    ===================================== */

    static async getTopOpportunities(

        stocksData,

        limit = 10

    ) {

        try {

            const scans =
                await this.scanMarket(
                    stocksData
                );

            return scans.slice(0, limit);

        }

        catch (error) {

            console.error(`
=========================================
TOP OPPORTUNITIES ERROR
=========================================
`);

            return [];
        }
    }
}

/* =========================================
   EXPORT
========================================= */

export default InstitutionalScanner;