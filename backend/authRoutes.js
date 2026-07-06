/* =========================================
   TRADEFINDER AI - AUTH ROUTES
========================================= */
const express = require("express");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const dotenv = require("dotenv");

dotenv.config();

const router = express.Router();

/* =========================================
   MOCK DATABASE
   (Replace with MongoDB Model Later)
========================================= */

const users = [];

/* =========================================
   GENERATE JWT
========================================= */

function generateToken(user) {

    return jwt.sign(

        {

            id: user.id,

            email: user.email
        },

        process.env.JWT_SECRET,

        {

            expiresIn:
                process.env.JWT_EXPIRE
        }
    );
}

/* =========================================
   REGISTER USER
========================================= */

router.post(

    "/register",

    async (req, res) => {

        try {

            const {

                username,

                email,

                password

            } = req.body;

            /* =====================
               VALIDATION
            ===================== */

            if (

                !username ||

                !email ||

                !password

            ) {

                return res.status(400)
                .json({

                    success: false,

                    message:
                        "All fields required"
                });
            }

            /* =====================
               CHECK EXISTING USER
            ===================== */

            const existingUser =

                users.find(

                    user =>

                        user.email ===
                        email
                );

            if (existingUser) {

                return res.status(400)
                .json({

                    success: false,

                    message:
                        "User already exists"
                });
            }

            /* =====================
               HASH PASSWORD
            ===================== */

            const hashedPassword =

                await bcrypt.hash(

                    password,

                    10
                );

            /* =====================
               CREATE USER
            ===================== */

            const user = {

                id:
                    Date.now(),

                username,

                email,

                password:
                    hashedPassword,

                createdAt:
                    new Date(),

                subscription:
                    "FREE"
            };

            users.push(user);

            /* =====================
               TOKEN
            ===================== */

            const token =
                generateToken(user);

            console.log(`
=========================================
NEW USER REGISTERED
=========================================
`);

            return res.status(201)
            .json({

                success: true,

                token,

                user: {

                    id: user.id,

                    username:
                        user.username,

                    email:
                        user.email
                }
            });

        }

        catch (error) {

            console.error(`
=========================================
REGISTER ERROR
=========================================
`);

            console.error(error.message);

            return res.status(500)
            .json({

                success: false,

                error:
                    error.message
            });
        }
    }
);

/* =========================================
   LOGIN USER
========================================= */

router.post(

    "/login",

    async (req, res) => {

        try {

            const {

                email,

                password

            } = req.body;

            /* =====================
               FIND USER
            ===================== */

            const user = users.find(

                u => u.email === email
            );

            if (!user) {

                return res.status(401)
                .json({

                    success: false,

                    message:
                        "Invalid credentials"
                });
            }

            /* =====================
               PASSWORD CHECK
            ===================== */

            const isMatch =

                await bcrypt.compare(

                    password,

                    user.password
                );

            if (!isMatch) {

                return res.status(401)
                .json({

                    success: false,

                    message:
                        "Invalid password"
                });
            }

            /* =====================
               GENERATE TOKEN
            ===================== */

            const token =
                generateToken(user);

            console.log(`
=========================================
USER LOGIN SUCCESS
=========================================
`);

            return res.json({

                success: true,

                token,

                user: {

                    id: user.id,

                    username:
                        user.username,

                    email:
                        user.email
                }
            });

        }

        catch (error) {

            console.error(`
=========================================
LOGIN ERROR
=========================================
`);

            console.error(error.message);

            return res.status(500)
            .json({

                success: false,

                error:
                    error.message
            });
        }
    }
);

/* =========================================
   VERIFY TOKEN
========================================= */

router.get(

    "/verify",

    async (req, res) => {

        try {

            const token =

                req.headers.authorization
                ?.split(" ")[1];

            if (!token) {

                return res.status(401)
                .json({

                    success: false,

                    message:
                        "No token"
                });
            }

            const decoded =
                jwt.verify(

                    token,

                    process.env.JWT_SECRET
                );

            return res.json({

                success: true,

                user: decoded
            });

        }

        catch (error) {

            return res.status(401)
            .json({

                success: false,

                message:
                    "Invalid token"
            });
        }
    }
);

/* =========================================
   LOGOUT
========================================= */

router.post(

    "/logout",

    (req, res) => {

        return res.json({

            success: true,

            message:
                "Logout successful"
        });
    }
);

/* =========================================
   EXPORTS
========================================= */

module.exports = router;