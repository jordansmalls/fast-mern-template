import { Router } from "express";
import mongoose from "mongoose";
import config from "../config/config.js";

const router = Router();

// Liveness probe: no auth, no DB write. Load balancers and
// uptime monitors hit this to decide if the process is alive.
router.get("/", (_req, res) => {
    const dbState = mongoose.connection.readyState; // 1 = connected
    return res.status(200).json({
        success: true,
        message: "Server is healthy.",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
        database: dbState === 1 ? "connected" : "disconnected",
    });
});

export default router;
