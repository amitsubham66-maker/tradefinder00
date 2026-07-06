/* =========================================
   TRADEFINDER AI - REINFORCEMENT LEARNING
========================================= */

import fs from "fs";

import path from "path";

import LoggingService from "../services/loggingService.js";

/* =========================================
   RL CONFIG
========================================= */

const RLConfig = {

    LEARNING_RATE: 0.1,

    DISCOUNT_FACTOR: 0.9,

    EXPLORATION_RATE: 0.2
};

/* =========================================
   REINFORCEMENT LEARNING ENGINE
========================================= */

class ReinforcementLearningEngine {

    static qTable = {};

    /* =====================================
       LOAD Q TABLE
    ===================================== */

    static loadQTable() {

        try {

            const qPath = path.join(

                process.cwd(),

                "models",

                "qtable.json"
            );

            if (

                fs.existsSync(qPath)

            ) {

                this.qTable = JSON.parse(

                    fs.readFileSync(qPath)
                );
            }

        }

        catch (error) {

            LoggingService.logError(

                "LOAD_QTABLE",

                error
            );
        }
    }

    /* =====================================
       SAVE Q TABLE
    ===================================== */

    static saveQTable() {

        try {

            const modelDir = path.join(

                process.cwd(),

                "models"
            );

            if (

                !fs.existsSync(modelDir)

            ) {

                fs.mkdirSync(modelDir);
            }

            fs.writeFileSync(

                path.join(
                    modelDir,
                    "qtable.json"
                ),

                JSON.stringify(
                    this.qTable,
                    null,
                    2
                )
            );

        }

        catch (error) {

            LoggingService.logError(

                "SAVE_QTABLE",

                error
            );
        }
    }

    /* =====================================
       GET STATE
    ===================================== */

    static getState(

        marketData

    ) {

        try {

            return [

                marketData.marketRegime,

                marketData.volatilityLevel,

                marketData.trend,

                marketData.rsiZone
            ].join("_");

        }

        catch (error) {

            LoggingService.logError(

                "GET_STATE",

                error
            );

            return "UNKNOWN";
        }
    }

    /* =====================================
       CHOOSE ACTION
    ===================================== */

    static chooseAction(

        state

    ) {

        try {

            const actions = [

                "BUY",

                "SELL",

                "HOLD"
            ];

            /* =============================
               EXPLORATION
            ============================= */

            if (

                Math.random() <

                RLConfig.EXPLORATION_RATE

            ) {

                return actions[
                    Math.floor(
                        Math.random() *
                        actions.length
                    )
                ];
            }

            /* =============================
               EXPLOITATION
            ============================= */

            if (

                !this.qTable[state]

            ) {

                this.qTable[state] = {

                    BUY: 0,

                    SELL: 0,

                    HOLD: 0
                };
            }

            const stateActions =
                this.qTable[state];

            return Object.keys(

                stateActions

            ).reduce(

                (a, b) =>

                    stateActions[a] >

                    stateActions[b]

                    ?

                    a

                    :

                    b
            );

        }

        catch (error) {

            LoggingService.logError(

                "CHOOSE_ACTION",

                error
            );

            return "HOLD";
        }
    }

    /* =====================================
       UPDATE Q VALUE
    ===================================== */

    static updateQValue(

        state,

        action,

        reward,

        nextState

    ) {

        try {

            if (

                !this.qTable[state]

            ) {

                this.qTable[state] = {

                    BUY: 0,

                    SELL: 0,

                    HOLD: 0
                };
            }

            if (

                !this.qTable[nextState]

            ) {

                this.qTable[nextState] = {

                    BUY: 0,

                    SELL: 0,

                    HOLD: 0
                };
            }

            const currentQ =

                this.qTable[state][action];

            const maxFutureQ = Math.max(

                ...Object.values(
                    this.qTable[nextState]
                )
            );

            /* =============================
               Q LEARNING
            ============================= */

            const updatedQ =

                currentQ +

                RLConfig.LEARNING_RATE *

                (

                    reward +

                    RLConfig.DISCOUNT_FACTOR *

                    maxFutureQ -

                    currentQ
                );

            this.qTable[state][action] =
                Number(
                    updatedQ.toFixed(4)
                );

            this.saveQTable();

            return updatedQ;

        }

        catch (error) {

            LoggingService.logError(

                "UPDATE_QVALUE",

                error
            );

            return 0;
        }
    }

    /* =====================================
       REWARD FUNCTION
    ===================================== */

    static calculateReward(

        trade

    ) {

        try {

            let reward = 0;

            /* =============================
               PNL
            ============================= */

            reward += trade.pnl / 100;

            /* =============================
               WIN BONUS
            ============================= */

            if (trade.pnl > 0) {

                reward += 5;
            }

            /* =============================
               LOSS PENALTY
            ============================= */

            if (trade.pnl < 0) {

                reward -= 5;
            }

            /* =============================
               HIGH CONFIDENCE BONUS
            ============================= */

            if (

                trade.confidence > 80

            ) {

                reward += 2;
            }

            return Number(
                reward.toFixed(2)
            );

        }

        catch (error) {

            LoggingService.logError(

                "CALCULATE_REWARD",

                error
            );

            return 0;
        }
    }

    /* =====================================
       TRAIN FROM TRADE
    ===================================== */

    static trainFromTrade(

        trade,

        marketState,

        nextMarketState

    ) {

        try {

            const state =
                this.getState(
                    marketState
                );

            const nextState =
                this.getState(
                    nextMarketState
                );

            const reward =
                this.calculateReward(
                    trade
                );

            this.updateQValue(

                state,

                trade.action,

                reward,

                nextState
            );

            return {

                state,

                reward,

                nextState
            };

        }

        catch (error) {

            LoggingService.logError(

                "TRAIN_FROM_TRADE",

                error
            );

            return null;
        }
    }

    /* =====================================
       AI DECISION
    ===================================== */

    static getAIDecision(

        marketData

    ) {

        try {

            const state =
                this.getState(
                    marketData
                );

            const action =
                this.chooseAction(
                    state
                );

            const confidence =

                this.qTable[state]

                ?

                Math.max(

                    ...Object.values(
                        this.qTable[state]
                    )
                ) * 10

                :

                50;

            return {

                state,

                action,

                confidence:
                    Math.min(
                        confidence,
                        99
                    )
            };

        }

        catch (error) {

            LoggingService.logError(

                "AI_DECISION",

                error
            );

            return {

                action: "HOLD"
            };
        }
    }
}

/* =========================================
   INITIALIZE
========================================= */

ReinforcementLearningEngine.loadQTable();

/* =========================================
   EXPORT
========================================= */

export default ReinforcementLearningEngine;