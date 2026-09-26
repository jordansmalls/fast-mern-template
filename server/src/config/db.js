import mongoose from "mongoose";
import config from "./config.js";
import logger from "./logger.js";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.mongoUri);
        logger.info(`MongoDB connected: ${conn.connection.host}`);
    } catch (err) {
        logger.error(`MongoDB connection error: ${err.message}`);
        process.exit(1);
    }
};

export default connectDB;
