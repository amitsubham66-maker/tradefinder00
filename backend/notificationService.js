/* =========================================
   TRADEFINDER AI - NOTIFICATION SERVICE
========================================= */

import nodemailer from "nodemailer";

import axios from "axios";

import dotenv from "dotenv";

import {

    sendUserNotification

} from "../websocket/websocketManager.js";

dotenv.config();

/* =========================================
   EMAIL TRANSPORT
========================================= */

const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {

        user:
            process.env.EMAIL_USER,

        pass:
            process.env.EMAIL_PASS
    }
});

/* =========================================
   TELEGRAM CONFIG
========================================= */

const TELEGRAM_BOT_TOKEN =
    process.env.TELEGRAM_BOT_TOKEN;

const TELEGRAM_CHAT_ID =
    process.env.TELEGRAM_CHAT_ID;

/* =========================================
   NOTIFICATION SERVICE
========================================= */

class NotificationService {

    /* =====================================
       SEND EMAIL
    ===================================== */

    static async sendEmail(

        to,

        subject,

        html

    ) {

        try {

            const mailOptions = {

                from:
                    process.env.EMAIL_USER,

                to,

                subject,

                html
            };

            const info =
                await transporter.sendMail(

                    mailOptions
                );

            console.log(`
=========================================
EMAIL SENT
=========================================
`);

            console.log(info.response);

            return true;

        }

        catch (error) {

            console.error(`
=========================================
EMAIL ERROR
=========================================
`);

            console.error(error.message);

            return false;
        }
    }

    /* =====================================
       SEND TELEGRAM MESSAGE
    ===================================== */

    static async sendTelegramAlert(

        message

    ) {

        try {

            const url =

                `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

            await axios.post(

                url,

                {

                    chat_id:
                        TELEGRAM_CHAT_ID,

                    text:
                        message,

                    parse_mode:
                        "HTML"
                }
            );

            console.log(`
=========================================
TELEGRAM ALERT SENT
=========================================
`);

            return true;

        }

        catch (error) {

            console.error(`
=========================================
TELEGRAM ERROR
=========================================
`);

            console.error(error.message);

            return false;
        }
    }

    /* =====================================
       SEND WEBSOCKET ALERT
    ===================================== */

    static sendRealtimeAlert(

        userId,

        data

    ) {

        try {

            sendUserNotification(

                userId,

                data
            );

            console.log(`
=========================================
REALTIME ALERT SENT
=========================================
`);

            return true;

        }

        catch (error) {

            console.error(`
=========================================
REALTIME ALERT ERROR
=========================================
`);

            console.error(error.message);

            return false;
        }
    }

    /* =====================================
       AI SIGNAL ALERT
    ===================================== */

    static async sendAISignalAlert(

        userId,

        signal

    ) {

        try {

            const message = `
🚀 AI SIGNAL ALERT

Symbol: ${signal.symbol}

Signal: ${signal.signal}

Confidence: ${signal.confidence}%

Entry: ${signal.entry}

Target: ${signal.target}

Stoploss: ${signal.stoploss}
`;

            /* =====================
               TELEGRAM
            ===================== */

            await this.sendTelegramAlert(
                message
            );

            /* =====================
               WEBSOCKET
            ===================== */

            this.sendRealtimeAlert(

                userId,

                {

                    type:
                        "AI_SIGNAL",

                    signal
                }
            );

            return true;

        }

        catch (error) {

            console.error(`
=========================================
AI SIGNAL ALERT ERROR
=========================================
`);

            console.error(error.message);

            return false;
        }
    }

    /* =====================================
       ORDER EXECUTION ALERT
    ===================================== */

    static async sendOrderAlert(

        userId,

        order

    ) {

        try {

            const message = `
📈 ORDER EXECUTED

Symbol: ${order.symbol}

Side: ${order.side}

Quantity: ${order.quantity}

Price: ${order.entryPrice}

Status: ${order.status}
`;

            await this.sendTelegramAlert(
                message
            );

            this.sendRealtimeAlert(

                userId,

                {

                    type:
                        "ORDER_UPDATE",

                    order
                }
            );

            return true;

        }

        catch (error) {

            console.error(`
=========================================
ORDER ALERT ERROR
=========================================
`);

            console.error(error.message);

            return false;
        }
    }

    /* =====================================
       STOPLOSS ALERT
    ===================================== */

    static async sendStoplossAlert(

        userId,

        trade

    ) {

        try {

            const message = `
🛑 STOPLOSS HIT

Symbol: ${trade.symbol}

PnL: ${trade.pnl}

Exit Price: ${trade.exitPrice}
`;

            await this.sendTelegramAlert(
                message
            );

            this.sendRealtimeAlert(

                userId,

                {

                    type:
                        "STOPLOSS",

                    trade
                }
            );

            return true;

        }

        catch (error) {

            console.error(`
=========================================
STOPLOSS ALERT ERROR
=========================================
`);

            return false;
        }
    }

    /* =====================================
       TARGET ALERT
    ===================================== */

    static async sendTargetAlert(

        userId,

        trade

    ) {

        try {

            const message = `
🎯 TARGET ACHIEVED

Symbol: ${trade.symbol}

PnL: ${trade.pnl}

Exit Price: ${trade.exitPrice}
`;

            await this.sendTelegramAlert(
                message
            );

            this.sendRealtimeAlert(

                userId,

                {

                    type:
                        "TARGET_HIT",

                    trade
                }
            );

            return true;

        }

        catch (error) {

            console.error(`
=========================================
TARGET ALERT ERROR
=========================================
`);

            return false;
        }
    }

    /* =====================================
       DAILY REPORT EMAIL
    ===================================== */

    static async sendDailyReport(

        email,

        analytics

    ) {

        try {

            const html = `
<h1>TRADEFINDER AI DAILY REPORT</h1>

<p>Total Trades:
${analytics.totalTrades}</p>

<p>Win Rate:
${analytics.winRate}%</p>

<p>Total PnL:
₹${analytics.totalPnL}</p>
`;

            await this.sendEmail(

                email,

                "Daily Trading Report",

                html
            );

            return true;

        }

        catch (error) {

            console.error(`
=========================================
DAILY REPORT ERROR
=========================================
`);

            return false;
        }
    }
}

/* =========================================
   EXPORT
========================================= */

export default NotificationService;