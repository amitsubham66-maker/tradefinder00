/* =========================================
   TRADEFINDER AI - PM2 CONFIG
========================================= */

module.exports = {

    apps: [

        {

            /* =============================
               APPLICATION
            ============================= */

            name:
                "tradefinder-ai",

            script:
                "./backend/server.js",

            /* =============================
               CLUSTER MODE
            ============================= */

            exec_mode:
                "cluster",

            instances:
                "max",

            /* =============================
               AUTO RESTART
            ============================= */

            autorestart: true,

            watch: false,

            max_memory_restart:
                "1G",

            /* =============================
               LOG FILES
            ============================= */

            error_file:
                "./backend/logs/pm2-error.log",

            out_file:
                "./backend/logs/pm2-out.log",

            log_file:
                "./backend/logs/pm2-combined.log",

            time: true,

            /* =============================
               ENVIRONMENT VARIABLES
            ============================= */

            env: {

                NODE_ENV:
                    "development",

                PORT: 5000
            },

            env_production: {

                NODE_ENV:
                    "production",

                PORT:
                    process.env.PORT || 5000
            },

            /* =============================
               ADVANCED SETTINGS
            ============================= */

            min_uptime:
                "10s",

            max_restarts: 10,

            restart_delay: 5000,

            listen_timeout: 10000,

            kill_timeout: 5000,

            /* =============================
               MONITORING
            ============================= */

            monitoring: true,

            /* =============================
               CRON RESTART
            ============================= */

            cron_restart:
                "0 3 * * *"
        }
    ]
};