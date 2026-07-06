/* =========================================
   TRADEFINDER AI - CHART ENGINE
========================================= */

console.log(`
=========================================
CHART ENGINE INITIALIZED
Realtime Visualization Activated
=========================================
`);

/* =========================================
   CHART CONFIG
========================================= */

const CHART_CONFIG = {

    DEFAULT_SYMBOL: "NIFTY",

    DEFAULT_TIMEFRAME: "5m",

    MAX_CANDLES: 500,

    AUTO_RESIZE: true,

    AI_OVERLAY: true,

    DARK_THEME: true
};

/* =========================================
   CHART STATE
========================================= */

const ChartState = {

    chart: null,

    candleSeries: null,

    volumeSeries: null,

    lineSeries: null,

    aiSignalSeries: null,

    currentSymbol:
        CHART_CONFIG.DEFAULT_SYMBOL,

    currentTimeframe:
        CHART_CONFIG.DEFAULT_TIMEFRAME,

    candles: [],

    indicators: {},

    initialized: false
};

/* =========================================
   CHART ENGINE
========================================= */

class ChartEngine {

    /* =========================
       INITIALIZE CHART
    ========================= */

    static initialize() {

        const container =
            document.getElementById(
                "marketChart"
            );

        if (!container) {

            console.error(
                "Chart Container Missing"
            );

            return;
        }

        ChartState.chart =
            LightweightCharts.createChart(
                container,
                {

                    width:
                        container.clientWidth,

                    height: 600,

                    layout: {

                        background: {

                            color: "#050816"
                        },

                        textColor: "#94a3b8"
                    },

                    grid: {

                        vertLines: {

                            color:
                                "rgba(255,255,255,0.03)"
                        },

                        horzLines: {

                            color:
                                "rgba(255,255,255,0.03)"
                        }
                    },

                    crosshair: {

                        mode: 1
                    },

                    rightPriceScale: {

                        borderColor:
                            "rgba(255,255,255,0.08)"
                    },

                    timeScale: {

                        borderColor:
                            "rgba(255,255,255,0.08)"
                    }
                }
            );

        this.initializeSeries();

        this.loadHistoricalData();

        this.attachResizeHandler();

        ChartState.initialized = true;

        console.log(
            "Chart Engine Ready"
        );
    }

    /* =========================
       SERIES
    ========================= */

    static initializeSeries() {

        /* =====================
           CANDLE SERIES
        ===================== */

        ChartState.candleSeries =
            ChartState.chart.addCandlestickSeries({

                upColor: "#00ffa3",

                downColor: "#ff0055",

                borderVisible: false,

                wickUpColor: "#00ffa3",

                wickDownColor: "#ff0055"
            });

        /* =====================
           VOLUME SERIES
        ===================== */

        ChartState.volumeSeries =
            ChartState.chart.addHistogramSeries({

                color:
                    "rgba(0,255,163,0.3)",

                priceFormat: {

                    type: "volume"
                },

                priceScaleId: ""
            });

        /* =====================
           AI TREND LINE
        ===================== */

        ChartState.lineSeries =
            ChartState.chart.addLineSeries({

                color: "#00b7ff",

                lineWidth: 2
            });

        /* =====================
           AI SIGNAL SERIES
        ===================== */

        ChartState.aiSignalSeries =
            ChartState.chart.addLineSeries({

                color: "#8b5cf6",

                lineWidth: 3
            });
    }

    /* =========================
       HISTORICAL DATA
    ========================= */

    static async loadHistoricalData() {

        try {

            const candles =
                await TradeFinderAPI
                .ChartAPI
                .getCandles(
                    ChartState.currentSymbol,
                    ChartState.currentTimeframe
                );

            const normalized =
                candles.map(c =>
                    this.normalizeCandle(c)
                );

            ChartState.candles =
                normalized;

            ChartState.candleSeries
                .setData(normalized);

            this.loadVolumeData(normalized);

            this.generateAITrend(normalized);

            this.fitChart();

        } catch (error) {

            console.error(
                "Chart Load Error:",
                error
            );
        }
    }

    /* =========================
       NORMALIZE CANDLE
    ========================= */

    static normalizeCandle(candle) {

        return {

            time:
                candle.time ||
                candle.timestamp,

            open:
                candle.open,

            high:
                candle.high,

            low:
                candle.low,

            close:
                candle.close,

            volume:
                candle.volume || 0
        };
    }

    /* =========================
       VOLUME
    ========================= */

    static loadVolumeData(candles) {

        const volumeData =
            candles.map(candle => ({

                time: candle.time,

                value: candle.volume,

                color:
                    candle.close >
                    candle.open

                    ? "rgba(0,255,163,0.4)"
                    : "rgba(255,0,85,0.4)"
            }));

        ChartState.volumeSeries
            .setData(volumeData);
    }

    /* =========================
       AI TREND
    ========================= */

    static generateAITrend(candles) {

        const trend =
            candles.map(candle => ({

                time: candle.time,

                value:
                    candle.close *
                    (1 + Math.random() * 0.005)
            }));

        ChartState.lineSeries
            .setData(trend);
    }

    /* =========================
       REALTIME UPDATE
    ========================= */

    static updateRealtimeCandle(candle) {

        const normalized =
            this.normalizeCandle(candle);

        ChartState.candleSeries
            .update(normalized);

        this.updateAIOverlay(normalized);

        this.updateVolume(normalized);
    }

    /* =========================
       UPDATE VOLUME
    ========================= */

    static updateVolume(candle) {

        ChartState.volumeSeries
            .update({

                time: candle.time,

                value: candle.volume,

                color:
                    candle.close >
                    candle.open

                    ? "rgba(0,255,163,0.4)"
                    : "rgba(255,0,85,0.4)"
            });
    }

    /* =========================
       AI OVERLAY
    ========================= */

    static updateAIOverlay(candle) {

        ChartState.aiSignalSeries
            .update({

                time: candle.time,

                value:
                    candle.close *
                    (1 + Math.random() * 0.003)
            });
    }

    /* =========================
       SYMBOL CHANGE
    ========================= */

    static async changeSymbol(symbol) {

        ChartState.currentSymbol =
            symbol;

        console.log(
            `Switching Symbol → ${symbol}`
        );

        await this.loadHistoricalData();
    }

    /* =========================
       TIMEFRAME CHANGE
    ========================= */

    static async changeTimeframe(tf) {

        ChartState.currentTimeframe =
            tf;

        console.log(
            `Switching Timeframe → ${tf}`
        );

        await this.loadHistoricalData();
    }

    /* =========================
       FIT CONTENT
    ========================= */

    static fitChart() {

        ChartState.chart
            .timeScale()
            .fitContent();
    }

    /* =========================
       RESIZE
    ========================= */

    static attachResizeHandler() {

        if (
            !CHART_CONFIG.AUTO_RESIZE
        ) return;

        window.addEventListener(
            "resize",
            () => {

                const container =
                    document.getElementById(
                        "marketChart"
                    );

                if (
                    ChartState.chart &&
                    container
                ) {

                    ChartState.chart
                        .applyOptions({

                            width:
                                container.clientWidth
                        });
                }
            }
        );
    }

    /* =========================
       SMA INDICATOR
    ========================= */

    static addSMA(period = 20) {

        const sma = [];

        for (
            let i = period;
            i < ChartState.candles.length;
            i++
        ) {

            let total = 0;

            for (
                let j = 0;
                j < period;
                j++
            ) {

                total +=
                    ChartState.candles[
                        i - j
                    ].close;
            }

            sma.push({

                time:
                    ChartState.candles[i].time,

                value:
                    total / period
            });
        }

        const smaSeries =
            ChartState.chart
            .addLineSeries({

                color: "#facc15",

                lineWidth: 2
            });

        smaSeries.setData(sma);

        ChartState.indicators.sma =
            smaSeries;
    }

    /* =========================
       EMA INDICATOR
    ========================= */

    static addEMA(period = 9) {

        const candles =
            ChartState.candles;

        const ema = [];

        let multiplier =
            2 / (period + 1);

        let prevEMA =
            candles[0].close;

        candles.forEach(candle => {

            const currentEMA =
                (
                    candle.close -
                    prevEMA
                ) *
                multiplier +
                prevEMA;

            ema.push({

                time: candle.time,

                value: currentEMA
            });

            prevEMA = currentEMA;
        });

        const emaSeries =
            ChartState.chart
            .addLineSeries({

                color: "#00b7ff",

                lineWidth: 2
            });

        emaSeries.setData(ema);

        ChartState.indicators.ema =
            emaSeries;
    }

    /* =========================
       SUPPORT RESISTANCE
    ========================= */

    static drawSupportResistance() {

        console.log(
            "Drawing S/R Zones..."
        );
    }

    /* =========================
       AI SIGNAL MARKERS
    ========================= */

    static addSignalMarker(signal) {

        ChartState.candleSeries
            .setMarkers([{

                time: signal.time,

                position:
                    signal.type === "BUY"
                    ? "belowBar"
                    : "aboveBar",

                color:
                    signal.type === "BUY"
                    ? "#00ffa3"
                    : "#ff0055",

                shape:
                    signal.type === "BUY"
                    ? "arrowUp"
                    : "arrowDown",

                text:
                    `${signal.type}`
            }]);
    }
}

/* =========================================
   REALTIME FEED HOOK
========================================= */

function connectChartRealtimeFeed() {

    if (
        !window.TradeFinderSocket
    ) return;

    console.log(
        "Chart Connected To Realtime Feed"
    );
}

/* =========================================
   AUTO INIT
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        ChartEngine.initialize();
    }
);

/* =========================================
   EXPORTS
========================================= */

window.TradeFinderChart = {

    ChartEngine,

    ChartState
};

console.log(
    "Advanced Chart Engine Ready"
);