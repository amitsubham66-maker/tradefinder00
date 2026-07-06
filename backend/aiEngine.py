# =========================================
# TRADEFINDER AI - AI ENGINE
# =========================================

import numpy as np

import pandas as pd

from flask import Flask, request, jsonify

from sklearn.preprocessing import MinMaxScaler

from tensorflow.keras.models import Sequential

from tensorflow.keras.layers import (
    Dense,
    LSTM,
    Dropout
)

import tensorflow as tf

import random

# =========================================
# APP INIT
# =========================================

app = Flask(__name__)

# =========================================
# GLOBAL CONFIG
# =========================================

AI_CONFIG = {

    "sequence_length": 50,

    "prediction_threshold": 0.7,

    "epochs": 10,

    "batch_size": 32
}

# =========================================
# AI STATE
# =========================================

AI_STATE = {

    "model_loaded": False,

    "predictions": [],

    "training_status": "IDLE"
}

# =========================================
# SCALER
# =========================================

scaler = MinMaxScaler(
    feature_range=(0, 1)
)

# =========================================
# CREATE LSTM MODEL
# =========================================

def create_lstm_model():

    model = Sequential()

    model.add(
        LSTM(
            units=128,
            return_sequences=True,
            input_shape=(50, 5)
        )
    )

    model.add(
        Dropout(0.2)
    )

    model.add(
        LSTM(
            units=64
        )
    )

    model.add(
        Dropout(0.2)
    )

    model.add(
        Dense(
            units=32,
            activation="relu"
        )
    )

    model.add(
        Dense(
            units=3,
            activation="softmax"
        )
    )

    model.compile(

        optimizer="adam",

        loss="categorical_crossentropy",

        metrics=["accuracy"]
    )

    return model

# =========================================
# LOAD MODEL
# =========================================

print("""
=========================================
LOADING AI MODEL
=========================================
""")

model = create_lstm_model()

AI_STATE["model_loaded"] = True

# =========================================
# FEATURE ENGINEERING
# =========================================

def prepare_features(data):

    df = pd.DataFrame(data)

    features = np.array([

        df["open"],

        df["high"],

        df["low"],

        df["close"],

        df["volume"]

    ]).T

    scaled = scaler.fit_transform(features)

    return np.array([scaled])

# =========================================
# MARKET ANALYSIS
# =========================================

def analyze_market(data):

    close_prices = np.array(data["close"])

    volume = np.array(data["volume"])

    trend_strength = (
        close_prices[-1] -
        close_prices[0]
    )

    avg_volume = np.mean(volume)

    current_volume = volume[-1]

    volume_spike = (
        current_volume > avg_volume * 1.5
    )

    return {

        "trend_strength":
            float(trend_strength),

        "volume_spike":
            bool(volume_spike),

        "market_bias":

            "BULLISH"

            if trend_strength > 0

            else "BEARISH"
    }

# =========================================
# AI PREDICTION
# =========================================

def generate_prediction(data):

    try:

        features = prepare_features(data)

        prediction = model.predict(
            features,
            verbose=0
        )

        bullish_prob = float(prediction[0][0])

        bearish_prob = float(prediction[0][1])

        sideways_prob = float(prediction[0][2])

        analysis = analyze_market(data)

        signal = max(

            [

                ("BULLISH",
                 bullish_prob),

                ("BEARISH",
                 bearish_prob),

                ("SIDEWAYS",
                 sideways_prob)
            ],

            key=lambda x: x[1]
        )

        confidence = round(signal[1] * 100, 2)

        result = {

            "signal":
                signal[0],

            "confidence":
                confidence,

            "bullish_probability":
                bullish_prob,

            "bearish_probability":
                bearish_prob,

            "sideways_probability":
                sideways_prob,

            "market_analysis":
                analysis,

            "timestamp":
                pd.Timestamp.now().isoformat()
        }

        AI_STATE["predictions"].append(
            result
        )

        return result

    except Exception as error:

        return {

            "error":
                str(error)
        }

# =========================================
# AI API
# =========================================

@app.route(
    "/predict",
    methods=["POST"]
)

def predict():

    try:

        data = request.json

        prediction = generate_prediction(data)

        return jsonify(prediction)

    except Exception as error:

        return jsonify({

            "success": False,

            "error": str(error)
        })

# =========================================
# AI HEALTH
# =========================================

@app.route("/health")

def health():

    return jsonify({

        "status": "ACTIVE",

        "model_loaded":
            AI_STATE["model_loaded"],

        "predictions":
            len(
                AI_STATE["predictions"]
            ),

        "tensorflow":
            tf.__version__
    })

# =========================================
# TRAIN MODEL
# =========================================

@app.route(
    "/train",
    methods=["POST"]
)

def train_model():

    AI_STATE["training_status"] = "TRAINING"

    return jsonify({

        "success": True,

        "status":
            "TRAINING_STARTED"
    })

# =========================================
# RUN SERVER
# =========================================

if __name__ == "__main__":

    print("""
=========================================
TRADEFINDER AI ENGINE STARTED
=========================================
""")

    app.run(

        host="0.0.0.0",

        port=8000,

        debug=True
    )