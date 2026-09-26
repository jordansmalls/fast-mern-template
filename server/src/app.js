import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import sanitizeRequest from "./middleware/sanitize.js";
import requestContext from "./middleware/request-context.js";
import config from "./config/config.js";
import { morganMiddleware } from "./config/logger.js";
import { apiLimiter } from "./middleware/rate-limit.js";
import { notFound, errorHandler } from "./middleware/error-handler.js";
import authRoutes from "./routes/auth-routes.js";
import healthRoutes from "./routes/health-routes.js";

const app = express();

// Trust the reverse proxy (Render/Heroku/Nginx) so secure cookies
// and rate-limit IPs behave correctly in production.
if (config.isProduction) {
    app.set("trust proxy", 1);
}

// Request id + AsyncLocalStorage scope first: every log line below
// (morgan included) carries the same requestId automatically.
app.use(requestContext);
app.use(helmet());
app.use(compression());
app.use(cors(config.corsOptions));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
// Strips $ and . from user input so NoSQL operator injection can't
// reach Mongoose queries. (Express 5-safe wrapper, see middleware/sanitize.js.)
app.use(sanitizeRequest);
app.use(morganMiddleware);

// Unauthenticated probe for load balancers / uptime monitors.
app.use("/health", healthRoutes);

app.use("/api", apiLimiter);
app.use("/api/auth", authRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
