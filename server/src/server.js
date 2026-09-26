import chalk from "chalk";
import app from "./app.js";
import config, { validateRuntimeConfig } from "./config/config.js";
import connectDB from "./config/db.js";
import logger from "./config/logger.js";

validateRuntimeConfig();
await connectDB();

const server = app.listen(config.port, () => {
    // Human banner on stdout; the machine-readable line below stays clean JSON.
    console.log(chalk.green(`Server running in ${config.nodeEnv} mode on port ${config.port}`));
    logger.info("server.listening", { meta: { port: config.port, nodeEnv: config.nodeEnv } });
});

process.on("unhandledRejection", (err) => {
    logger.error(`Unhandled rejection: ${err.message}`);
    server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
    logger.error(`Uncaught exception: ${err.message}`);
    process.exit(1);
});
