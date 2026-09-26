import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import ms from "ms";
import config from "../config/config.js";

export const ACCESS_COOKIE = "accessToken";
export const REFRESH_COOKIE = "refreshToken";

export function signAccessToken(userId) {
    return jwt.sign({ sub: userId, type: "access" }, config.jwtSecret, {
        expiresIn: config.jwtAccessExpiresIn,
        // Unique per token so two tokens minted in the same second never
        // collide — rotation must always invalidate the presented token.
        jwtid: randomUUID(),
    });
}

export function signRefreshToken(userId) {
    return jwt.sign({ sub: userId, type: "refresh" }, config.jwtRefreshSecret, {
        expiresIn: config.jwtRefreshExpiresIn,
        jwtid: randomUUID(),
    });
}

export function verifyAccessToken(token) {
    return jwt.verify(token, config.jwtSecret);
}

export function verifyRefreshToken(token) {
    return jwt.verify(token, config.jwtRefreshSecret);
}

function baseCookieOptions(maxAge) {
    const options = {
        httpOnly: true,
        secure: config.isProduction,
        // "strict" breaks top-level OAuth-style redirects; "lax" is the
        // safe default for same-site apps. Strict in prod per PLAN.
        sameSite: config.isProduction ? "strict" : "lax",
        path: "/",
        maxAge,
    };
    if (config.cookieDomain) {
        options.domain = config.cookieDomain;
    }
    return options;
}

function expiryToMs(expiresIn, fallbackMs) {
    try {
        const value = ms(expiresIn);
        return typeof value === "number" ? value : fallbackMs;
    } catch {
        return fallbackMs;
    }
}

export function setAuthCookies(res, { accessToken, refreshToken }) {
    res.cookie(ACCESS_COOKIE, accessToken, baseCookieOptions(expiryToMs(config.jwtAccessExpiresIn, 15 * 60 * 1000)));
    res.cookie(
        REFRESH_COOKIE,
        refreshToken,
        baseCookieOptions(expiryToMs(config.jwtRefreshExpiresIn, 7 * 24 * 60 * 60 * 1000)),
    );
}

export function clearAuthCookies(res) {
    const options = { ...baseCookieOptions(undefined), maxAge: undefined };
    res.clearCookie(ACCESS_COOKIE, { ...options, path: "/" });
    res.clearCookie(REFRESH_COOKIE, { ...options, path: "/" });
}
