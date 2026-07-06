/* =========================================
   TRADEFINDER AI - SECURITY SERVICE
========================================= */

import jwt from "jsonwebtoken";

import bcrypt from "bcryptjs";

import crypto from "crypto";

import rateLimit from "express-rate-limit";

import LoggingService from "../services/loggingService.js";

/* =========================================
   SECURITY CONFIG
========================================= */

const SecurityConfig = {

    JWT_EXPIRES_IN: "7d",

    SALT_ROUNDS: 12,

    MAX_LOGIN_ATTEMPTS: 5,

    LOCK_TIME: 15 * 60 * 1000
};

/* =========================================
   LOGIN ATTEMPTS TRACKER
========================================= */

const LoginAttempts = new Map();

/* =========================================
   SECURITY SERVICE
========================================= */

class SecurityService {

    /* =====================================
       HASH PASSWORD
    ===================================== */

    static async hashPassword(password) {

        try {

            return await bcrypt.hash(

                password,

                SecurityConfig
                .SALT_ROUNDS
            );

        }

        catch (error) {

            LoggingService.logError(

                "HASH_PASSWORD",

                error
            );

            throw error;
        }
    }

    /* =====================================
       COMPARE PASSWORD
    ===================================== */

    static async comparePassword(

        password,

        hashedPassword

    ) {

        try {

            return await bcrypt.compare(

                password,

                hashedPassword
            );

        }

        catch (error) {

            LoggingService.logError(

                "COMPARE_PASSWORD",

                error
            );

            return false;
        }
    }

    /* =====================================
       GENERATE JWT TOKEN
    ===================================== */

    static generateToken(user) {

        try {

            return jwt.sign(

                {

                    id: user._id,

                    email: user.email,

                    role: user.role
                },

                process.env.JWT_SECRET,

                {

                    expiresIn:
                        SecurityConfig
                        .JWT_EXPIRES_IN
                }
            );

        }

        catch (error) {

            LoggingService.logError(

                "GENERATE_TOKEN",

                error
            );

            return null;
        }
    }

    /* =====================================
       VERIFY JWT TOKEN
    ===================================== */

    static verifyToken(token) {

        try {

            return jwt.verify(

                token,

                process.env.JWT_SECRET
            );

        }

        catch (error) {

            LoggingService.logError(

                "VERIFY_TOKEN",

                error
            );

            return null;
        }
    }

    /* =====================================
       GENERATE API KEY
    ===================================== */

    static generateAPIKey() {

        try {

            return crypto
                .randomBytes(32)
                .toString("hex");

        }

        catch (error) {

            LoggingService.logError(

                "GENERATE_API_KEY",

                error
            );

            return null;
        }
    }

    /* =====================================
       RATE LIMITER
    ===================================== */

    static createRateLimiter() {

        return rateLimit({

            windowMs:
                15 * 60 * 1000,

            max: 100,

            message:

                "Too many requests, please try again later.",

            standardHeaders: true,

            legacyHeaders: false
        });
    }

    /* =====================================
       LOGIN ATTEMPT TRACKING
    ===================================== */

    static trackLoginAttempt(email) {

        try {

            if (

                !LoginAttempts.has(email)

            ) {

                LoginAttempts.set(

                    email,

                    {

                        attempts: 0,

                        lockUntil: null
                    }
                );
            }

            const userAttempts =
                LoginAttempts.get(email);

            /* =====================
               ACCOUNT LOCKED
            ===================== */

            if (

                userAttempts.lockUntil &&

                userAttempts.lockUntil >
                Date.now()

            ) {

                return {

                    allowed: false,

                    message:
                        "Account temporarily locked"
                };
            }

            userAttempts.attempts++;

            /* =====================
               LOCK ACCOUNT
            ===================== */

            if (

                userAttempts.attempts >=

                SecurityConfig
                .MAX_LOGIN_ATTEMPTS

            ) {

                userAttempts.lockUntil =

                    Date.now() +

                    SecurityConfig
                    .LOCK_TIME;

                LoggingService.logSecurity({

                    userId: email,

                    ip: "UNKNOWN",

                    action:
                        "ACCOUNT_LOCKED",

                    status:
                        "FAILED"
                });

                return {

                    allowed: false,

                    message:
                        "Too many failed attempts"
                };
            }

            return {

                allowed: true,

                attempts:
                    userAttempts.attempts
            };

        }

        catch (error) {

            LoggingService.logError(

                "TRACK_LOGIN_ATTEMPT",

                error
            );

            return {

                allowed: false
            };
        }
    }

    /* =====================================
       RESET LOGIN ATTEMPTS
    ===================================== */

    static resetLoginAttempts(email) {

        LoginAttempts.delete(email);
    }

    /* =====================================
       ROLE CHECK
    ===================================== */

    static hasRole(

        user,

        roles = []

    ) {

        try {

            return roles.includes(
                user.role
            );

        }

        catch (error) {

            LoggingService.logError(

                "ROLE_CHECK",

                error
            );

            return false;
        }
    }

    /* =====================================
       SUSPICIOUS ACTIVITY DETECTION
    ===================================== */

    static detectSuspiciousActivity(

        activity

    ) {

        try {

            const suspiciousPatterns = [

                "MULTIPLE_FAILED_LOGINS",

                "TOKEN_MANIPULATION",

                "API_SPAM",

                "UNAUTHORIZED_ACCESS"
            ];

            if (

                suspiciousPatterns.includes(
                    activity.type
                )

            ) {

                LoggingService.logSecurity({

                    userId:
                        activity.userId,

                    ip:
                        activity.ip,

                    action:
                        activity.type,

                    status:
                        "SUSPICIOUS"
                });

                return true;
            }

            return false;

        }

        catch (error) {

            LoggingService.logError(

                "SUSPICIOUS_ACTIVITY",

                error
            );

            return false;
        }
    }

    /* =====================================
       SANITIZE INPUT
    ===================================== */

    static sanitizeInput(input) {

        try {

            if (

                typeof input !==
                "string"

            ) {

                return input;
            }

            return input

                .replace(/</g, "&lt;")

                .replace(/>/g, "&gt;")

                .replace(/'/g, "")

                .replace(/"/g, "");

        }

        catch (error) {

            LoggingService.logError(

                "SANITIZE_INPUT",

                error
            );

            return input;
        }
    }
}

/* =========================================
   EXPORT
========================================= */

export default SecurityService;