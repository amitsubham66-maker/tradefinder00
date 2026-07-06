/* =========================================
   TRADEFINDER AI - SENTIMENT ANALYSIS
========================================= */

import LoggingService
from "../services/loggingService.js";

import RedisService
from "../services/redisService.js";

import WebsocketCluster
from "../websocket/websocketCluster.js";

/* =========================================
   SENTIMENT ENGINE
========================================= */

class SentimentAnalysisEngine {

    /* =====================================
       POSITIVE / NEGATIVE KEYWORDS
    ===================================== */

    static positiveKeywords = [

        "bullish",
        "growth",
        "profit",
        "strong",
        "breakout",
        "buy",
        "positive",
        "surge",
        "uptrend",
        "record high"
    ];

    static negativeKeywords = [

        "bearish",
        "crash",
        "loss",
        "selloff",
        "panic",
        "weak",
        "downgrade",
        "recession",
        "fear",
        "bankruptcy"
    ];

    /* =====================================
       ANALYZE TEXT SENTIMENT
    ===================================== */

    static analyzeText(

        text

    ) {

        try {

            const content =
                text.toLowerCase();

            let score = 0;

            /* =============================
               POSITIVE WORDS
            ============================= */

            for (

                const keyword of
                this.positiveKeywords

            ) {

                if (

                    content.includes(
                        keyword
                    )

                ) {

                    score += 10;
                }
            }

            /* =============================
               NEGATIVE WORDS
            ============================= */

            for (

                const keyword of
                this.negativeKeywords

            ) {

                if (

                    content.includes(
                        keyword
                    )

                ) {

                    score -= 10;
                }
            }

            /* =============================
               FINAL SENTIMENT
            ============================= */

            let sentiment = "NEUTRAL";

            if (score > 20) {

                sentiment = "BULLISH";
            }

            else if (score < -20) {

                sentiment = "BEARISH";
            }

            return {

                sentiment,

                score,

                confidence:
                    Math.min(
                        Math.abs(score),
                        95
                    )
            };

        }

        catch (error) {

            LoggingService.logError(

                "TEXT_SENTIMENT",

                error
            );

            return {

                sentiment:
                    "NEUTRAL",

                score: 0
            };
        }
    }

    /* =====================================
       ANALYZE NEWS
    ===================================== */

    static analyzeNews(

        newsArticles

    ) {

        try {

            let totalScore = 0;

            const results = [];

            for (

                const article of
                newsArticles

            ) {

                const analysis =
                    this.analyzeText(

                        article.title +

                        " " +

                        article.description
                    );

                totalScore +=
                    analysis.score;

                results.push({

                    headline:
                        article.title,

                    ...analysis
                });
            }

            const avgScore =

                newsArticles.length > 0

                ?

                totalScore /
                newsArticles.length

                :

                0;

            return {

                averageScore:
                    Number(
                        avgScore.toFixed(2)
                    ),

                sentiment:

                    avgScore > 15

                    ?

                    "BULLISH"

                    :

                    avgScore < -15

                    ?

                    "BEARISH"

                    :

                    "NEUTRAL",

                articles:
                    results
            };

        }

        catch (error) {

            LoggingService.logError(

                "NEWS_SENTIMENT",

                error
            );

            return {

                sentiment:
                    "NEUTRAL"
            };
        }
    }

    /* =====================================
       SOCIAL MEDIA ANALYSIS
    ===================================== */

    static analyzeSocialMedia(

        posts

    ) {

        try {

            let score = 0;

            for (const post of posts) {

                const analysis =
                    this.analyzeText(
                        post.content
                    );

                score += analysis.score;
            }

            const average =

                posts.length > 0

                ?

                score / posts.length

                :

                0;

            return {

                score:
                    Number(
                        average.toFixed(2)
                    ),

                sentiment:

                    average > 10

                    ?

                    "BULLISH"

                    :

                    average < -10

                    ?

                    "BEARISH"

                    :

                    "NEUTRAL"
            };

        }

        catch (error) {

            LoggingService.logError(

                "SOCIAL_SENTIMENT",

                error
            );

            return {

                sentiment:
                    "NEUTRAL"
            };
        }
    }

    /* =====================================
       GLOBAL SENTIMENT
    ===================================== */

    static async generateMarketSentiment(

        newsData,

        socialData

    ) {

        try {

            const newsSentiment =
                this.analyzeNews(
                    newsData
                );

            const socialSentiment =
                this.analyzeSocialMedia(
                    socialData
                );

            const combinedScore =

                (

                    newsSentiment.averageScore +

                    socialSentiment.score

                ) / 2;

            let marketMood = "NEUTRAL";

            if (combinedScore > 15) {

                marketMood = "GREED";
            }

            else if (combinedScore < -15) {

                marketMood = "FEAR";
            }

            const report = {

                timestamp:
                    new Date(),

                combinedScore:
                    Number(
                        combinedScore
                        .toFixed(2)
                    ),

                marketMood,

                newsSentiment,

                socialSentiment
            };

            /* =============================
               CACHE
            ============================= */

            await RedisService.set(

                "MARKET_SENTIMENT",

                report,

                300
            );

            /* =============================
               BROADCAST
            ============================= */

            await WebsocketCluster
            .publishAISignal({

                type:
                    "MARKET_SENTIMENT",

                report
            });

            return report;

        }

        catch (error) {

            LoggingService.logError(

                "MARKET_SENTIMENT",

                error
            );

            return {

                marketMood:
                    "NEUTRAL"
            };
        }
    }
}

/* =========================================
   EXPORT
========================================= */

export default SentimentAnalysisEngine;