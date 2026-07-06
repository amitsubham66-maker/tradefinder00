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

    static async updateOptionApex() {
        try {
            const res = await fetch("http://localhost:5000/api/market/option-apex/NIFTY");
            const data = await res.json();
            if (data && data.success) {
                const needle = document.getElementById("apexGaugeNeedle");
                const valueEl = document.getElementById("apexGaugeValue");
                if (needle && valueEl) {
                    let rotation = 0;
                    if (data.operatorBias === "BULLISH") {
                        rotation = 45;
                        valueEl.className = "absolute bottom-4 font-black text-xl text-emerald-400";
                    } else if (data.operatorBias === "BEARISH") {
                        rotation = -45;
                        valueEl.className = "absolute bottom-4 font-black text-xl text-red-400";
                    } else {
                        valueEl.className = "absolute bottom-4 font-black text-xl text-yellow-400";
                    }
                    needle.style.transform = `rotate(${rotation}deg)`;
                    valueEl.innerText = data.operatorBias;
                }

                const progressFill = document.getElementById("apexAccumulationFill");
                const speedVal = document.getElementById("apexAccumulationValue");
                if (progressFill && speedVal) {
                    progressFill.style.width = `${Math.min(100, data.accumulationRate * 6.5)}%`;
                    speedVal.innerText = `${data.accumulationRate}% / min`;
                }

                const callOI = document.getElementById("apexTotalCallOI");
                const putOI = document.getElementById("apexTotalPutOI");
                if (callOI) callOI.innerText = data.callOIsum.toLocaleString();
                if (putOI) putOI.innerText = data.putOIsum.toLocaleString();

                const callChange = document.getElementById("apexCallWriteChange");
                const putChange = document.getElementById("apexPutWriteChange");
                const crossover = document.getElementById("apexPCRCrossStatus");
                
                if (callChange) {
                    callChange.innerText = (data.operatorSentiment.callWritingChange >= 0 ? "+" : "") + data.operatorSentiment.callWritingChange.toLocaleString();
                    callChange.className = "text-xl font-bold mt-1 " + (data.operatorSentiment.callWritingChange >= 0 ? "text-emerald-400" : "text-red-400");
                }
                if (putChange) {
                    putChange.innerText = (data.operatorSentiment.putWritingChange >= 0 ? "+" : "") + data.operatorSentiment.putWritingChange.toLocaleString();
                    putChange.className = "text-xl font-bold mt-1 " + (data.operatorSentiment.putWritingChange >= 0 ? "text-emerald-400" : "text-red-400");
                }
                if (crossover) {
                    crossover.innerText = data.operatorSentiment.pcrCrossover;
                    crossover.className = "text-xl font-bold mt-1 " + (data.operatorSentiment.pcrCrossover.includes("BULLISH") ? "text-emerald-400" : "text-red-400");
                }
            }
        } catch (err) {
            console.error("Failed to update Option Apex:", err);
        }
    }

    static async updateOptionClock() {
        try {
            const res = await fetch("http://localhost:5000/api/market/option-clock/NIFTY");
            const data = await res.json();
            if (data && data.success && data.snapshots) {
                const needle = document.getElementById("clockNeedle");
                const timeWin = document.getElementById("clockTimeWindow");
                if (needle && timeWin) {
                    needle.style.transform = `rotate(${(Math.random() - 0.5) * 120}deg)`;
                    timeWin.innerText = data.activeTimeWindow;
                }

                const body = document.getElementById("optionClockTableBody");
                if (body) {
                    body.innerHTML = data.snapshots.map(s => {
                        let colorClass = "text-emerald-400";
                        if (s.bias.includes("SHORT")) colorClass = "text-red-400";
                        else if (s.bias.includes("UNWINDING")) colorClass = "text-yellow-400";
                        
                        return `
                            <tr class="border-t border-slate-800/50">
                                <td class="py-3 text-slate-400 font-bold">${s.time}</td>
                                <td class="py-3 ${s.callOIChange >= 0 ? 'text-emerald-400' : 'text-red-400'}">${(s.callOIChange >= 0 ? '+' : '') + s.callOIChange.toLocaleString()}</td>
                                <td class="py-3 ${s.putOIChange >= 0 ? 'text-emerald-400' : 'text-red-400'}">${(s.putOIChange >= 0 ? '+' : '') + s.putOIChange.toLocaleString()}</td>
                                <td class="py-3 ${colorClass} font-bold">${s.bias}</td>
                            </tr>
                        `;
                    }).join("");
                }
            }
        } catch (err) {
            console.error("Failed to update Option Clock:", err);
        }
    }
}

window.updateOptionApexLoop = () => OptionsEngine.updateOptionApex();
window.updateOptionClockLoop = () => OptionsEngine.updateOptionClock();

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