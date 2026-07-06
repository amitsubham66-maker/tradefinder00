/* =========================================
   TRADEFINDER AI - OPTIONS ENGINE
========================================= */

console.log(`
=========================================
OPTIONS ENGINE INITIALIZED
Institutional Derivatives Intelligence Active
=========================================
`);

/* =========================================
   OPTIONS CONFIGURATION
========================================= */

const OptionsConfig = {

    DEFAULT_SYMBOL: "NIFTY",

    UPDATE_INTERVAL: 5000,

    PCR_BULLISH: 1.2,

    PCR_BEARISH: 0.7,

    MAX_STRIKES: 20,

    ENABLE_GAMMA: true,

    ENABLE_IV_ANALYSIS: true,

    ENABLE_SMART_MONEY: true
};

/* =========================================
   OPTIONS STATE
========================================= */

const OptionsState = {

    optionChain: [],

    pcr: 0,

    maxPain: 0,

    totalCallOI: 0,

    totalPutOI: 0,

    callDominance: 0,

    putDominance: 0,

    marketBias: "NEUTRAL",

    ivState: "NORMAL",

    gammaExposure: 0,

    smartMoneyFlow: "NEUTRAL",

    lastUpdated: null
};

/* =========================================
   OPTIONS ENGINE
========================================= */

class OptionsEngine {

    /* =========================
       INITIALIZE
    ========================= */

    static async initialize() {

        console.log(
            "Initializing Options Engine..."
        );

        await this.loadOptionChain();

        this.startRealtimeLoop();
    }

    /* =========================
       REALTIME LOOP
    ========================= */

    static startRealtimeLoop() {

        setInterval(async () => {

            try {

                await this.loadOptionChain();

                this.calculatePCR();

                this.calculateMaxPain();

                this.calculateGammaExposure();

                this.detectSmartMoney();

                this.detectIVState();

                this.generateAIBias();

                this.updateUI();

            } catch (error) {

                console.error(
                    "Options Loop Error:",
                    error
                );
            }

        }, OptionsConfig.UPDATE_INTERVAL);
    }

    /* =========================
       OPTION CHAIN FETCH
    ========================= */

    static async loadOptionChain() {

        try {

            const response =
                await TradeFinderAPI
                .OptionsAPI
                .getOptionChain(
                    OptionsConfig
                    .DEFAULT_SYMBOL
                );

            OptionsState.optionChain =
                response.records
                ?.data || [];

            OptionsState.lastUpdated =
                Date.now();

            console.log(
                "Option Chain Updated"
            );

        } catch (error) {

            console.error(
                "Option Chain Error:",
                error
            );
        }
    }

    /* =========================
       PCR ENGINE
    ========================= */

    static calculatePCR() {

        let totalCalls = 0;

        let totalPuts = 0;

        OptionsState.optionChain
        .forEach(strike => {

            totalCalls +=
                strike.CE?.openInterest || 0;

            totalPuts +=
                strike.PE?.openInterest || 0;
        });

        OptionsState.totalCallOI =
            totalCalls;

        OptionsState.totalPutOI =
            totalPuts;

        const pcr =
            totalPuts /
            (
                totalCalls || 1
            );

        OptionsState.pcr =
            Number(
                pcr.toFixed(2)
            );

        console.log(
            `PCR: ${OptionsState.pcr}`
        );
    }

    /* =========================
       MAX PAIN ENGINE
    ========================= */

    static calculateMaxPain() {

        let maxPainStrike = 0;

        let minimumPain =
            Infinity;

        OptionsState.optionChain
        .forEach(strike => {

            const callOI =
                strike.CE
                ?.openInterest || 0;

            const putOI =
                strike.PE
                ?.openInterest || 0;

            const pain =
                Math.abs(
                    callOI - putOI
                );

            if (
                pain < minimumPain
            ) {

                minimumPain = pain;

                maxPainStrike =
                    strike.strikePrice;
            }
        });

        OptionsState.maxPain =
            maxPainStrike;

        console.log(
            `Max Pain: ${maxPainStrike}`
        );
    }

    /* =========================
       GAMMA EXPOSURE
    ========================= */

    static calculateGammaExposure() {

        let gamma = 0;

        OptionsState.optionChain
        .forEach(strike => {

            const ceGamma =
                strike.CE?.impliedVolatility || 0;

            const peGamma =
                strike.PE?.impliedVolatility || 0;

            gamma +=
                ceGamma + peGamma;
        });

        OptionsState.gammaExposure =
            Number(
                gamma.toFixed(2)
            );

        console.log(
            `Gamma Exposure:
             ${OptionsState.gammaExposure}`
        );
    }

    /* =========================
       SMART MONEY DETECTION
    ========================= */

    static detectSmartMoney() {

        let bullishOI = 0;

        let bearishOI = 0;

        OptionsState.optionChain
        .forEach(strike => {

            if (
                strike.PE?.changeinOpenInterest > 0
            ) {

                bullishOI +=
                    strike.PE
                    .changeinOpenInterest;
            }

            if (
                strike.CE?.changeinOpenInterest > 0
            ) {

                bearishOI +=
                    strike.CE
                    .changeinOpenInterest;
            }
        });

        OptionsState.smartMoneyFlow =

            bullishOI > bearishOI

            ? "BULLISH"

            : "BEARISH";

        console.log(
            `Smart Money:
             ${OptionsState.smartMoneyFlow}`
        );
    }

    /* =========================
       IMPLIED VOLATILITY
    ========================= */

    static detectIVState() {

        let totalIV = 0;

        let count = 0;

        OptionsState.optionChain
        .forEach(strike => {

            if (
                strike.CE?.impliedVolatility
            ) {

                totalIV +=
                    strike.CE
                    .impliedVolatility;

                count++;
            }

            if (
                strike.PE?.impliedVolatility
            ) {

                totalIV +=
                    strike.PE
                    .impliedVolatility;

                count++;
            }
        });

        const avgIV =
            totalIV /
            (
                count || 1
            );

        if (avgIV > 25) {

            OptionsState.ivState =
                "HIGH_VOLATILITY";

        } else if (avgIV < 12) {

            OptionsState.ivState =
                "LOW_VOLATILITY";

        } else {

            OptionsState.ivState =
                "NORMAL";
        }
    }

    /* =========================
       AI MARKET BIAS
    ========================= */

    static generateAIBias() {

        const pcr =
            OptionsState.pcr;

        if (
            pcr >=
            OptionsConfig.PCR_BULLISH
        ) {

            OptionsState.marketBias =
                "STRONG_BULLISH";

        } else if (

            pcr <=
            OptionsConfig.PCR_BEARISH

        ) {

            OptionsState.marketBias =
                "STRONG_BEARISH";

        } else {

            OptionsState.marketBias =
                "NEUTRAL";
        }

        console.log(
            `Market Bias:
             ${OptionsState.marketBias}`
        );
    }

    /* =========================
       UI UPDATE
    ========================= */

    static updateUI() {

        this.updatePCR();

        this.updateMaxPain();

        this.updateMarketBias();

        this.updateOptionChain();

        this.updateGammaExposure();

        this.updateIVState();
    }

    /* =========================
       PCR UI
    ========================= */

    static updatePCR() {

        const element =
            document.getElementById(
                "pcrValue"
            );

        if (!element) return;

        element.innerHTML = `

            <div class="
                options-metric
                ${
                    OptionsState.pcr >
                    1

                    ? "green"

                    : "red"
                }
            ">

                PCR:
                ${OptionsState.pcr}

            </div>
        `;
    }

    /* =========================
       MAX PAIN UI
    ========================= */

    static updateMaxPain() {

        const element =
            document.getElementById(
                "maxPain"
            );

        if (!element) return;

        element.innerHTML = `

            <div class="options-metric">

                MAX PAIN:
                ${OptionsState.maxPain}

            </div>
        `;
    }

    /* =========================
       MARKET BIAS UI
    ========================= */

    static updateMarketBias() {

        const element =
            document.getElementById(
                "marketBias"
            );

        if (!element) return;

        element.innerHTML = `

            <div class="
                market-bias-card
                ${
                    OptionsState.marketBias
                    .includes("BULL")

                    ? "green"

                    : "red"
                }
            ">

                ${OptionsState.marketBias}

            </div>
        `;
    }

    /* =========================
       OPTION CHAIN UI
    ========================= */

    static updateOptionChain() {

        const container =
            document.getElementById(
                "optionChainTable"
            );

        if (!container) return;

        container.innerHTML = "";

        OptionsState.optionChain
        .slice(
            0,
            OptionsConfig.MAX_STRIKES
        )
        .forEach(strike => {

            container.innerHTML += `

                <div class="option-row">

                    <div class="ce-column">

                        <div>
                            OI:
                            ${strike.CE?.openInterest || 0}
                        </div>

                        <div>
                            IV:
                            ${strike.CE?.impliedVolatility || 0}
                        </div>

                    </div>

                    <div class="strike-column">

                        ${strike.strikePrice}

                    </div>

                    <div class="pe-column">

                        <div>
                            OI:
                            ${strike.PE?.openInterest || 0}
                        </div>

                        <div>
                            IV:
                            ${strike.PE?.impliedVolatility || 0}
                        </div>

                    </div>

                </div>
            `;
        });
    }

    /* =========================
       GAMMA UI
    ========================= */

    static updateGammaExposure() {

        const element =
            document.getElementById(
                "gammaExposure"
            );

        if (!element) return;

        element.innerHTML = `

            <div class="options-metric">

                GAMMA:
                ${OptionsState.gammaExposure}

            </div>
        `;
    }

    /* =========================
       IV UI
    ========================= */

    static updateIVState() {

        const element =
            document.getElementById(
                "ivState"
            );

        if (!element) return;

        element.innerHTML = `

            <div class="
                iv-card
                ${
                    OptionsState.ivState ===
                    "HIGH_VOLATILITY"

                    ? "red"

                    : "green"
                }
            ">

                ${OptionsState.ivState}

            </div>
        `;
    }
}

/* =========================================
   OPTIONS AI ENGINE
========================================= */

class OptionsAI {

    static analyze() {

        const bullishScore =

            (
                OptionsState.pcr > 1
                ? 30
                : 0
            ) +

            (
                OptionsState.smartMoneyFlow ===
                "BULLISH"

                ? 40
                : 0
            ) +

            (
                OptionsState.marketBias
                .includes("BULL")

                ? 30
                : 0
            );

        return {

            bullishProbability:
                bullishScore,

            bearishProbability:
                100 - bullishScore,

            recommendation:

                bullishScore > 70

                ? "BUY CALLS"

                : bullishScore < 30

                ? "BUY PUTS"

                : "NEUTRAL"
        };
    }
}

/* =========================================
   AUTO INITIALIZE
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        OptionsEngine.initialize();
    }
);

/* =========================================
   EXPORTS
========================================= */

window.TradeFinderOptions = {

    OptionsEngine,

    OptionsAI,

    OptionsState
};

console.log(
    "Institutional Options Engine Ready"
);