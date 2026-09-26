import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";
const frontendUrl = (
    process.env.FRONTEND_URL || (isProduction ? "https://app.sway.onl" : "http://localhost:3000")
).replace(/\/$/, "");

const corsOptions = {
    origin: frontendUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

const config = {
    port: Number(process.env.PORT) || 9999,
    nodeEnv,
    isProduction,
    jwtSecret: process.env.JWT_SECRET,
    // Falls back to JWT_SECRET so a single-secret setup still works.
    // Set JWT_REFRESH_SECRET separately in production for proper rotation hygiene.
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    mongoUri: process.env.MONGO_URI,
    frontendUrl,
    corsOptions,
    cookieDomain: process.env.COOKIE_DOMAIN || undefined,
    bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
    logLevel: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
    logFile: process.env.LOG_FILE || undefined,
};

export function validateRuntimeConfig() {
    const required = [
        ["MONGO_URI", config.mongoUri],
        ["JWT_SECRET", config.jwtSecret],
        ["FRONTEND_URL", process.env.FRONTEND_URL],
    ]
        .filter(([, value]) => !value)
        .map(([name]) => name);

    if (required.length) {
        throw new Error(`Missing required environment variables: ${required.join(", ")}`);
    }

    try {
        const frontend = new URL(config.frontendUrl);
        if (!["http:", "https:"].includes(frontend.protocol) || frontend.origin !== config.frontendUrl) {
            throw new Error();
        }
    } catch {
        throw new Error("FRONTEND_URL must be a valid HTTP(S) origin without a path or query.");
    }
}

export default config;
