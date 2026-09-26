import AppError from "../utils/app-error.js";
import logger from "../config/logger.js";

// 404 for anything that missed every route, in the template shape.
export const notFound = (req, _res, next) => {
    next(new AppError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// Central error handler. Must stay last in app.js.
// - AppError -> its status + message
// - Mongo E11000 duplicate key -> clean 409 (never a raw 500)
// - Mongoose validation/cast errors -> 400
// - JWT errors -> 401
// - Everything else -> 500 without leaking internals
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
    let statusCode = err.statusCode || 500;
    // Display-safe labels for operational errors (also sent to the client);
    // raw error names only surface on unexpected 500s.
    const statusLabels = {
        400: "Bad Request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Not Found",
        409: "Conflict",
        422: "Unprocessable Entity",
        429: "Too Many Requests",
    };
    let error = err.isOperational ? statusLabels[statusCode] || "Request Failed" : err.name || "Internal Server Error";
    let message = err.isOperational ? err.message : "We're having trouble, please try again soon.";

    if (err.code === 11000) {
        statusCode = 409;
        error = "Duplicate Field";
        const field = Object.keys(err.keyValue || {})[0] || "field";
        message = `That ${field} is already in use. Please use a different ${field}.`;
    } else if (err.name === "ValidationError") {
        statusCode = 400;
        error = "Validation Error";
        message = Object.values(err.errors || {})
            .map((e) => e.message)
            .join(". ");
    } else if (err.name === "CastError") {
        statusCode = 400;
        error = "Invalid ID";
        message = "The provided ID is not valid.";
    } else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
        statusCode = 401;
        error = "Unauthorized";
        message = "Your session has expired. Please log in again.";
    }

    // Same requestId/method/url as every other line in this request: the
    // failure correlates with its full trace (auth → validation → DB →
    // response) instead of floating as an orphaned stack trace. Stack is
    // attached on 500s only — 4xx carry message + status, no noise, no leak.
    logger.error(err.message || "Internal Server Error", {
        meta: {
            statusCode,
            error,
            ...(statusCode >= 500 ? { stack: err.stack } : {}),
        },
    });

    return res.status(statusCode).json({
        success: false,
        error,
        message,
    });
};
