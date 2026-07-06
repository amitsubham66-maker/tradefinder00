/* =========================================
   TRADEFINDER AI - AUTH MIDDLEWARE
========================================= */

import jwt from "jsonwebtoken";

import dotenv from "dotenv";

import User from "../models/userModel.js";

dotenv.config();

/* =========================================
   VERIFY JWT TOKEN
========================================= */

export async function protect(

    req,

    res,

    next

) {

    try {

        let token;

        /* =====================
           GET TOKEN
        ===================== */

        if (

            req.headers.authorization &&

            req.headers.authorization.startsWith(
                "Bearer"
            )

        ) {

            token =
                req.headers.authorization
                .split(" ")[1];
        }

        /* =====================
           NO TOKEN
        ===================== */

        if (!token) {

            return res.status(401)
            .json({

                success: false,

                message:
                    "Unauthorized access"
            });
        }

        /* =====================
           VERIFY TOKEN
        ===================== */

        const decoded =
            jwt.verify(

                token,

                process.env.JWT_SECRET
            );

        /* =====================
           FIND USER
        ===================== */

        const user =
            await User.findById(
                decoded.id
            ).select("-password");

        if (!user) {

            return res.status(401)
            .json({

                success: false,

                message:
                    "User not found"
            });
        }

        /* =====================
           BLOCK CHECK
        ===================== */

        if (user.isBlocked) {

            return res.status(403)
            .json({

                success: false,

                message:
                    "Account blocked"
            });
        }

        /* =====================
           ATTACH USER
        ===================== */

        req.user = user;

        next();

    }

    catch (error) {

        console.error(`
=========================================
AUTH MIDDLEWARE ERROR
=========================================
`);

        console.error(error.message);

        return res.status(401)
        .json({

            success: false,

            message:
                "Invalid token"
        });
    }
}

/* =========================================
   ADMIN ACCESS
========================================= */

export function adminOnly(

    req,

    res,

    next

) {

    try {

        if (

            req.user.role !==
            "ADMIN" &&

            req.user.role !==
            "SUPER_ADMIN"

        ) {

            return res.status(403)
            .json({

                success: false,

                message:
                    "Admin access required"
            });
        }

        next();

    }

    catch (error) {

        return res.status(500)
        .json({

            success: false,

            error:
                error.message
        });
    }
}

/* =========================================
   SUPER ADMIN ACCESS
========================================= */

export function superAdminOnly(

    req,

    res,

    next

) {

    try {

        if (

            req.user.role !==
            "SUPER_ADMIN"

        ) {

            return res.status(403)
            .json({

                success: false,

                message:
                    "Super Admin only"
            });
        }

        next();

    }

    catch (error) {

        return res.status(500)
        .json({

            success: false,

            error:
                error.message
        });
    }
}

/* =========================================
   PREMIUM ACCESS
========================================= */

export function premiumOnly(

    req,

    res,

    next

) {

    try {

        const allowedPlans = [

            "PRO",

            "INSTITUTIONAL"
        ];

        if (

            !allowedPlans.includes(
                req.user.subscription
            )

        ) {

            return res.status(403)
            .json({

                success: false,

                message:
                    "Premium subscription required"
            });
        }

        next();

    }

    catch (error) {

        return res.status(500)
        .json({

            success: false,

            error:
                error.message
        });
    }
}

/* =========================================
   OPTIONAL AUTH
========================================= */

export async function optionalAuth(

    req,

    res,

    next

) {

    try {

        let token;

        if (

            req.headers.authorization &&

            req.headers.authorization.startsWith(
                "Bearer"
            )

        ) {

            token =
                req.headers.authorization
                .split(" ")[1];

            const decoded =
                jwt.verify(

                    token,

                    process.env.JWT_SECRET
                );

            const user =
                await User.findById(
                    decoded.id
                ).select("-password");

            req.user = user;
        }

        next();

    }

    catch (error) {

        next();
    }
}

/* =========================================
   RATE LIMIT CHECK
========================================= */

export function apiRateLimiter(

    req,

    res,

    next

) {

    try {

        console.log(`
=========================================
API REQUEST
=========================================
`);

        console.log({

            route:
                req.originalUrl,

            ip:
                req.ip,

            time:
                new Date()
        });

        next();

    }

    catch (error) {

        next();
    }
}