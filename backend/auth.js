/* =========================================
   TRADEFINDER AI - AUTH ENGINE
========================================= */

console.log(`
=========================================
AUTH ENGINE INITIALIZED
Secure Authentication Active
=========================================
`);

/* =========================================
   AUTH CONFIG
========================================= */

const AuthConfig = {

    API_URL:
        "http://localhost:5000/api/auth",

    TOKEN_KEY:
        "tradefinder_token",

    USER_KEY:
        "tradefinder_user",

    SESSION_TIMEOUT:
        86400000
};

/* =========================================
   AUTH STATE
========================================= */

const AuthState = {

    user: null,

    token: null,

    authenticated: false,

    role: "USER",

    subscription: "FREE"
};

/* =========================================
   MAIN AUTH ENGINE
========================================= */

class AuthEngine {

    /* =========================
       INITIALIZE
    ========================= */

    static initialize() {

        console.log(
            "Auth Engine Started"
        );

        this.restoreSession();

        this.bindUIEvents();
    }

    /* =========================
       SIGNUP
    ========================= */

    static async signup(userData) {

        try {

            const response =
                await fetch(

                    `${AuthConfig.API_URL}/signup`,

                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                            "application/json"
                        },

                        body:
                            JSON.stringify(
                                userData
                            )
                    }
                );

            const data =
                await response.json();

            if (data.token) {

                this.setSession(data);

                this.showToast(
                    "Signup Successful"
                );
            }

            return data;

        } catch (error) {

            console.error(
                "Signup Error:",
                error
            );

            return null;
        }
    }

    /* =========================
       LOGIN
    ========================= */

    static async login(

        email,

        password

    ) {

        try {

            const response =
                await fetch(

                    `${AuthConfig.API_URL}/login`,

                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                            "application/json"
                        },

                        body:
                            JSON.stringify({

                                email,

                                password
                            })
                    }
                );

            const data =
                await response.json();

            if (data.token) {

                this.setSession(data);

                this.showToast(
                    "Login Successful"
                );

                this.redirectDashboard();
            }

            return data;

        } catch (error) {

            console.error(
                "Login Error:",
                error
            );

            return null;
        }
    }

    /* =========================
       LOGOUT
    ========================= */

    static logout() {

        localStorage.removeItem(
            AuthConfig.TOKEN_KEY
        );

        localStorage.removeItem(
            AuthConfig.USER_KEY
        );

        AuthState.user = null;

        AuthState.token = null;

        AuthState.authenticated =
            false;

        this.showToast(
            "Logged Out"
        );

        window.location.href =
            "/login.html";
    }

    /* =========================
       SESSION SET
    ========================= */

    static setSession(data) {

        AuthState.user =
            data.user;

        AuthState.token =
            data.token;

        AuthState.authenticated =
            true;

        AuthState.role =
            data.user.role ||
            "USER";

        AuthState.subscription =
            data.user.subscription ||
            "FREE";

        localStorage.setItem(

            AuthConfig.TOKEN_KEY,

            data.token
        );

        localStorage.setItem(

            AuthConfig.USER_KEY,

            JSON.stringify(
                data.user
            )
        );
    }

    /* =========================
       RESTORE SESSION
    ========================= */

    static restoreSession() {

        const token =
            localStorage.getItem(
                AuthConfig.TOKEN_KEY
            );

        const user =
            localStorage.getItem(
                AuthConfig.USER_KEY
            );

        if (
            token &&
            user
        ) {

            AuthState.token =
                token;

            AuthState.user =
                JSON.parse(user);

            AuthState.authenticated =
                true;

            console.log(
                "Session Restored"
            );
        }
    }

    /* =========================
       TOKEN VALIDATION
    ========================= */

    static isAuthenticated() {

        return (
            AuthState.authenticated &&
            AuthState.token
        );
    }

    /* =========================
       PREMIUM CHECK
    ========================= */

    static hasPremium() {

        return [

            "PRO",

            "INSTITUTIONAL"
        ].includes(
            AuthState.subscription
        );
    }

    /* =========================
       ADMIN CHECK
    ========================= */

    static isAdmin() {

        return [

            "ADMIN",

            "SUPER_ADMIN"
        ].includes(
            AuthState.role
        );
    }

    /* =========================
       GOOGLE LOGIN
    ========================= */

    static async googleLogin() {

        console.log(
            "Google OAuth Login"
        );
    }

    /* =========================
       GITHUB LOGIN
    ========================= */

    static async githubLogin() {

        console.log(
            "GitHub OAuth Login"
        );
    }

    /* =========================
       BIND UI EVENTS
    ========================= */

    static bindUIEvents() {

        const loginForm =
            document.getElementById(
                "loginForm"
            );

        if (loginForm) {

            loginForm.addEventListener(
                "submit",

                async event => {

                    event.preventDefault();

                    const email =
                        document
                        .getElementById(
                            "email"
                        ).value;

                    const password =
                        document
                        .getElementById(
                            "password"
                        ).value;

                    await this.login(

                        email,

                        password
                    );
                }
            );
        }

        const signupForm =
            document.getElementById(
                "signupForm"
            );

        if (signupForm) {

            signupForm.addEventListener(
                "submit",

                async event => {

                    event.preventDefault();

                    const name =
                        document
                        .getElementById(
                            "name"
                        ).value;

                    const email =
                        document
                        .getElementById(
                            "signupEmail"
                        ).value;

                    const password =
                        document
                        .getElementById(
                            "signupPassword"
                        ).value;

                    await this.signup({

                        name,

                        email,

                        password
                    });
                }
            );
        }
    }

    /* =========================
       REDIRECT
    ========================= */

    static redirectDashboard() {

        window.location.href =
            "/dashboard.html";
    }

    /* =========================
       TOAST
    ========================= */

    static showToast(message) {

        const toast =
            document.createElement("div");

        toast.className =
            "auth-toast";

        toast.innerText =
            message;

        document.body.appendChild(
            toast
        );

        setTimeout(() => {

            toast.remove();

        }, 3000);
    }
}

/* =========================================
   AUTH GUARDS
========================================= */

class AuthGuard {

    static protectRoute() {

        if (
            !AuthEngine
            .isAuthenticated()
        ) {

            window.location.href =
                "/login.html";
        }
    }

    static protectPremium() {

        if (
            !AuthEngine
            .hasPremium()
        ) {

            alert(
                "Premium Required"
            );
        }
    }

    static protectAdmin() {

        if (
            !AuthEngine
            .isAdmin()
        ) {

            alert(
                "Admin Access Only"
            );
        }
    }
}

/* =========================================
   AUTO INITIALIZE
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        AuthEngine.initialize();
    }
);

/* =========================================
   EXPORTS
========================================= */

window.TradeFinderAuth = {

    AuthEngine,

    AuthState,

    AuthGuard
};

console.log(
    "Institutional Auth Engine Ready"
);