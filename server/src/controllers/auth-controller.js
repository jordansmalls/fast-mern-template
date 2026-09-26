import User, { normalizeEmail } from "../models/user.js";
import AppError from "../utils/app-error.js";
import asyncHandler from "../utils/async-handler.js";
import { setAuthCookies, clearAuthCookies, REFRESH_COOKIE } from "../utils/tokens.js";
import * as authService from "../services/auth-service.js";
import logger from "../config/logger.js";
import { setRequestUser } from "../middleware/request-context.js";

export const signup = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: "Invalid credentials",
            message: "Email and password are required.",
        });
    }

    const { user, accessToken, refreshToken } = await authService.signup({ email, password });
    setAuthCookies(res, { accessToken, refreshToken });
    setRequestUser(user._id);

    return res.status(201).json({
        success: true,
        message: "Account created successfully. You are now logged in.",
        user: user.toSafeObject(),
    });
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: "Invalid credentials",
            message: "Email and password are required.",
        });
    }

    const { user, accessToken, refreshToken } = await authService.login({ email, password });
    setAuthCookies(res, { accessToken, refreshToken });
    setRequestUser(user._id);

    return res.status(200).json({
        success: true,
        message: "Logged in successfully. Welcome back!",
        user: user.toSafeObject(),
    });
});

export const refresh = asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.refresh(req.cookies?.[REFRESH_COOKIE]);
    setAuthCookies(res, { accessToken, refreshToken });
    setRequestUser(user._id);

    return res.status(200).json({
        success: true,
        message: "Session refreshed successfully.",
        user: user.toSafeObject(),
    });
});

export const logout = asyncHandler(async (req, res) => {
    await authService.logout(req.cookies?.[REFRESH_COOKIE]);
    clearAuthCookies(res);

    return res.status(200).json({
        success: true,
        message: "Logged out successfully. See you soon!",
    });
});

export const getMe = asyncHandler(async (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Account details fetched successfully.",
        user: req.user.toSafeObject(),
    });
});

export const updateMe = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (email === undefined && password === undefined) {
        return res.status(400).json({
            success: false,
            error: "Invalid request",
            message: "Provide an email or password to update.",
        });
    }

    const user = await authService.updateAccount(req.user._id, { email, password });

    return res.status(200).json({
        success: true,
        message: "Account updated successfully.",
        user: user.toSafeObject(),
    });
});

export const deleteMe = asyncHandler(async (req, res) => {
    const { _id: userId, email } = req.user;
    await User.findByIdAndDelete(userId);
    logger.info("auth.account.deleted", { meta: { userId, email } });
    clearAuthCookies(res);

    return res.status(200).json({
        success: true,
        message: "Account deleted successfully. We're sorry to see you go!",
    });
});

export const checkEmailAvailable = asyncHandler(async (req, res) => {
    const email = normalizeEmail(req.query.email);
    const existing = await User.findOne({ email }).select("_id");
    if (existing) {
        throw new AppError(409, "That email is already in use. Please use a different email.");
    }

    return res.status(200).json({
        success: true,
        message: "That email is available.",
        available: true,
    });
});
