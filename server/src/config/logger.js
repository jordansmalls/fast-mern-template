import chalk from "chalk";
import morgan from "morgan";
import winston from "winston";
import config from "./config.js";
import { requestStore } from "../middleware/request-context.js";
import { sanitizeLog } from "../utils/redact.js";

// Every log line carries the same shape:
// { timestamp, level, message, requestId?, userId?, method?, url?, meta? }
// requestId/userId/method/url resolve from AsyncLocalStorage, so any code
// running inside a request logs correlated lines with zero plumbing.
// Explicit info fields win over store values (useful outside requests).
// Absent scope reads as absent keys — never `"requestId": null` noise.
const requestScope = winston.format((info) => {
    const store = requestStore.getStore();
    info.requestId = info.requestId ?? store?.requestId ?? undefined;
    info.userId = info.userId ?? store?.userId ?? undefined;
    info.method = info.method ?? store?.method ?? undefined;
    info.url = info.url ?? store?.url ?? undefined;
    if (info.meta !== undefined) {
        info.meta = sanitizeLog(info.meta);
    }
    return info;
});

const levelColors = {
    error: "red",
    warn: "yellow",
    info: "cyan",
    http: "magenta",
    debug: "gray",
};

// Human-readable dev lines. Same fields as the JSON output, just compact:
// `12:04:54 info  [a004f2c9] POST /api/auth/login auth.login {…}`
// HTTP access lines already contain method/url/status, so print them as-is.
const devFormat = winston.format.printf((info) => {
    const color = levelColors[info.level] ?? "white";
    const head = `${chalk.gray(info.timestamp)} ${chalk[color](info.level.padEnd(5))}`;
    if (info.level === "http") {
        return `${head} ${info.message}`;
    }
    const parts = [head];
    if (info.requestId) {
        parts.push(chalk.gray(`[${String(info.requestId).slice(0, 8)}]`));
    }
    if (info.method || info.url) {
        parts.push(`${info.method ?? ""} ${info.url ?? ""}`.trim());
    }
    parts.push(info.message);
    if (info.userId) {
        parts.push(chalk.gray(`user=${String(info.userId).slice(0, 8)}`));
    }
    if (info.meta !== undefined) {
        parts.push(chalk.gray(JSON.stringify(info.meta)));
    }
    return parts.join(" ");
});

const logger = winston.createLogger({
    level: config.logLevel,
    format: winston.format.combine(
        requestScope(),
        winston.format.timestamp({ format: config.isProduction ? undefined : "HH:mm:ss" }),
        // JSON in production for shippers to parse; pretty lines locally.
        // Same fields either way — only the rendering differs.
        config.isProduction ? winston.format.json() : devFormat,
    ),
    transports: [new winston.transports.Console()],
});

// File sink for local persistence; point a shipper (Datadog agent,
// Better Stack, etc.) at it, or swap in a dedicated transport later —
// call sites stay untouched.
if (config.logFile) {
    logger.add(new winston.transports.File({ filename: config.logFile }));
}

const morganStream = {
    write: (message) => logger.http(message.trim()),
};

morgan.token("req-id", (req) => req.id || "-");

// Single access-log format, piped into winston: HTTP logs and app logs
// share format, destination, and requestId — one traceable stream.
// Runs inside request-context (see app.js ordering) so scope attaches.
const morganMiddleware = morgan(":method :url :status :response-time ms :req-id", {
    stream: morganStream,
});

export { morganMiddleware };
export default logger;
