import User, { normalizeEmail } from "../models/user.js";
import AppError from "../utils/app-error.js";
import logger from "../config/logger.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens.js";

// Signs a fresh access + refresh pair and stores the refresh-token hash
// so refresh can rotate and logout can revoke.
async function issueTokenPair(user) {
    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    await user.setRefreshToken(refreshToken);
    await user.save();
    return { accessToken, refreshToken };
}

export async function signup({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
        throw new AppError(409, "That email is already in use. Please log in or use a different email.");
    }
    const user = await User.create({ email: normalizedEmail, password });
    const tokens = await issueTokenPair(user);
    logger.info("auth.signup", { meta: { userId: user._id, email: user.email } });
    return { user, ...tokens };
}

export async function login({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail }).select("+password +refreshTokenHash");
    if (!user || !(await user.comparePassword(password))) {
        logger.warn("auth.login.failed", { meta: { email: normalizedEmail } });
        throw new AppError(401, "Invalid email or password. Please try again.");
    }
    const tokens = await issueTokenPair(user);
    logger.info("auth.login", { meta: { userId: user._id, email: user.email } });
    return { user, ...tokens };
}

export async function refresh(refreshToken) {
    if (!refreshToken) {
        throw new AppError(401, "No refresh token provided. Please log in again.");
    }
    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch {
        throw new AppError(401, "Your session has expired. Please log in again.");
    }
    if (decoded.type !== "refresh") {
        throw new AppError(401, "Invalid session token. Please log in again.");
    }
    const user = await User.findById(decoded.sub).select("+refreshTokenHash");
    if (!user || !(await user.compareRefreshToken(refreshToken))) {
        throw new AppError(401, "Your session is no longer valid. Please log in again.");
    }
    // Rotation: the presented token is single-use from here on.
    const tokens = await issueTokenPair(user);
    logger.info("auth.refresh", { meta: { userId: user._id } });
    return { user, ...tokens };
}

// Revokes the session identified by the refresh token. Lenient by design:
// logout must always clear cookies, even with an expired/missing token.
export async function logout(refreshToken) {
    if (!refreshToken) {
        return;
    }
    try {
        const decoded = verifyRefreshToken(refreshToken);
        if (decoded.type === "refresh") {
            await User.findByIdAndUpdate(decoded.sub, { $set: { refreshTokenHash: null } });
            logger.info("auth.logout", { meta: { userId: decoded.sub } });
        }
    } catch {
        // Expired or forged token — nothing to revoke, cookies still clear.
    }
}

export async function updateAccount(userId, { email, password }) {
    const user = await User.findById(userId).select("+password");
    if (!user) {
        throw new AppError(404, "Account not found.");
    }
    const changes = {};
    if (email !== undefined) {
        const normalizedEmail = normalizeEmail(email);
        const taken = await User.findOne({ email: normalizedEmail, _id: { $ne: userId } });
        if (taken) {
            throw new AppError(409, "That email is already in use. Please use a different email.");
        }
        // Diff, not a snapshot: what changed, never secrets.
        if (user.email !== normalizedEmail) {
            changes.email = { from: user.email, to: normalizedEmail };
        }
        user.email = normalizedEmail;
    }
    if (password !== undefined) {
        user.password = password;
        changes.password = "changed";
    }
    await user.save();
    logger.info("auth.account.updated", { meta: { userId: user._id, changes } });
    return user;
}
