/* =========================================
   TRADEFINDER AI - REALTIME ANALYTICS ENGINE
========================================= */

import RedisService from "../services/redisService.js";

import LoggingService from "../services/loggingService.js";

import WebsocketCluster from "../websocket/websocketCluster.js";

/* =========================================
   ANALYTICS STATE
========================================= */

const AnalyticsState = {

    marketBreadth: {},

    volatilityIndex: 0,

    institutionalFlow: {},

    topMovers: [],

    marketRegime: "SIDEWAYS",

    realtimeMetrics: {}
};

/* =========================================
   ANALYTICS ENGINE
========================================= */

class AnalyticsRealtimeEngine {

    /* =====================================
       MARKET MOMENTUM ANALYSIS
    ===================================== */

    static analyzeMomentum(stockData) {

        try {

            const priceChange =

                (

                    (

                        stockData.ltp -

                        stockData.open

                    ) /

                    stockData.open

                ) * 100;

            const momentum = {

                symbol:
                    stockData.symbol,

                momentum:
                    Number(
                        priceChange.toFixed(2)
                    ),

                strength:

                    priceChange > 3

                    ?

                    "STRONG_BULLISH"

                    :

                    priceChange > 1

                    ?

                    "BULLISH"

                    :

                    priceChange < -3

                    ?

                    "STRONG_BEARISH"

                    :

                    priceChange < -1

                    ?

                    "BEARISH"

                    :

                    "SIDEWAYS"
            };

            return momentum;

        }

        catch (error) {

            LoggingService.logError(

                "MOMENTUM_ANALYSIS",

                error
            );

            return {};
        }
    }

    /* =====================================
       VOLATILITY ANALYSIS
    ===================================== */

    static analyzeVolatility(stockData) {

        try {

            const volatility =

                (

                    (

                        stockData.high -

                        stockData.low

                    ) /

                    stockData.open

                ) * 100;

            return {

                symbol:
                    stockData.symbol,

                volatility:
                    Number(
                        volatility.toFixed(2)
                    ),

                category:

                    volatility > 5

                    ?

                    "HIGH"

                    :

                    volatility > 2

                    ?

                    "MEDIUM"

                    :

                    "LOW"
            };

        }

        catch (error) {

            LoggingService.logError(

                "VOLATILITY_ANALYSIS",

                error
            );

            return {};
        }
    }

    /* =====================================
       OPTIONS FLOW ANALYSIS
    ===================================== */

    static analyzeOptionsFlow(optionData) {

        try {

            const pcr =

                optionData.putOI /

                optionData.callOI;

            const flow = {

                symbol:
                    optionData.symbol,

                pcr:
                    Number(
                        pcr.toFixed(2)
                    ),

                sentiment:

                    pcr > 1.2

                    ?

                    "BULLISH"

                    :

                    pcr < 0.7

                    ?

                    "BEARISH"

                    :

                    "NEUTRAL"
            };

            return flow;

        }

        catch (error) {

            LoggingService.logError(

                "OPTIONS_FLOW",

                error
            );

            return {};
        }
    }

    /* =====================================
       INSTITUTIONAL FLOW DETECTION
    ===================================== */

    static detectInstitutionalFlow(stockData) {

        try {

            const volumeSpike =

                stockData.volume /

                stockData.avgVolume;

            const deliveryRatio =

                stockData.deliveryQty /

                stockData.volume;

            const detected =

                volumeSpike > 3 &&

                deliveryRatio > 0.6;

            return {

                symbol:
                    stockData.symbol,

                institutionalActivity:
                    detected,

                volumeSpike:
                    Number(
                        volumeSpike.toFixed(2)
                    ),

                deliveryRatio:
                    Number(
                        deliveryRatio.toFixed(2)
                    )
            };

        }

        catch (error) {

            LoggingService.logError(

                "INSTITUTIONAL_FLOW",

                error
            );

            return {};
        }
    }

    /* =====================================
       MARKET BREADTH
    ===================================== */

    static calculateMarketBreadth(

        stocks

    ) {

        try {

            let advancing = 0;

            let declining = 0;

            for (const stock of stocks) {

                if (

                    stock.changePercent > 0

                ) {

                    advancing++;
                }

                else {

                    declining++;
                }
            }

            AnalyticsState.marketBreadth = {

                advancing,

                declining,

                ratio:

                    advancing /

                    (declining || 1)
            };

            return AnalyticsState
                .marketBreadth;

        }

        catch (error) {

            LoggingService.logError(

                "MARKET_BREADTH",

                error
            );

            return {};
        }
    }

    /* =====================================
       MARKET REGIME DETECTION
    ===================================== */

    static detectMarketRegime(

        marketData

    ) {

        try {

            const avgVolatility =

                marketData.reduce(

                    (sum, stock) =>

                        sum +

                        Math.abs(
                            stock.changePercent
                        ),

                    0
                ) / marketData.length;

            if (avgVolatility > 3) {

                AnalyticsState.marketRegime =
                    "VOLATILE";
            }

            else if (

                avgVolatility > 1.5

            ) {

                AnalyticsState.marketRegime =
                    "TRENDING";
            }

            else {

                AnalyticsState.marketRegime =
                    "SIDEWAYS";
            }

            return AnalyticsState
                .marketRegime;

        }

        catch (error) {

            LoggingService.logError(

                "MARKET_REGIME",

                error
            );

            return "UNKNOWN";
        }
    }

    /* =====================================
       TOP MOVERS
    ===================================== */

    static calculateTopMovers(

        stocks

    ) {

        try {

            AnalyticsState.topMovers =

                [...stocks]

                .sort(

                    (a, b) =>

                        Math.abs(
                            b.changePercent
                        ) -

                        Math.abs(
                            a.changePercent
                        )
                )

                .slice(0, 10);

            return AnalyticsState
                .topMovers;

        }

        catch (error) {

            LoggingService.logError(

                "TOP_MOVERS",

                error
            );

            return [];
        }
    }

    /* =====================================
       GENERATE DASHBOARD METRICS
    ===================================== */

    static async generateRealtimeMetrics(

        marketData

    ) {

        try {

            const breadth =
                this.calculateMarketBreadth(
                    marketData
                );

            const regime =
                this.detectMarketRegime(
                    marketData
                );

            const topMovers =
                this.calculateTopMovers(
                    marketData
                );

            AnalyticsState.realtimeMetrics = {

                timestamp:
                    new Date(),

                breadth,

                regime,

                topMovers,

                totalStocks:
                    marketData.length
            };

            /* =============================
               CACHE METRICS
            ============================= */

            await RedisService.set(

                "REALTIME_METRICS",

                AnalyticsState
                .realtimeMetrics,

                30
            );

            /* =============================
               BROADCAST
            ============================= */

            await WebsocketCluster
            .publishMarketData({

                type:
                    "REALTIME_ANALYTICS",

                metrics:
                    AnalyticsState
                    .realtimeMetrics
            });

            return AnalyticsState
                .realtimeMetrics;

        }

        catch (error) {

            LoggingService.logError(

                "REALTIME_METRICS",

                error
            );

            return {};
        }
    }

    /* =====================================
       GET ANALYTICS SNAPSHOT
    ===================================== */

    static getSnapshot() {

        return AnalyticsState;
    }
}

/* =========================================
   EXPORT
========================================= */

export default AnalyticsRealtimeEngine;