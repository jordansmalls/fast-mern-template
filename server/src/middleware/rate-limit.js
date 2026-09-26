import rateLimit from "express-rate-limit";

// Catches anything under /api so one noisy client can't crowd out others.
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        error: "Too Many Requests",
        message: "Too many requests, please try again later.",
    },
});

// Much stricter: login/signup/refresh are the brute-force surface.
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        error: "Too Many Requests",
        message: "Too many auth attempts, please try again later.",
    },
});
