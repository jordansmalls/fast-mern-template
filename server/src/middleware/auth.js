import User from "../models/user.js";
import AppError from "../utils/app-error.js";
import asyncHandler from "../utils/async-handler.js";
import { verifyAccessToken, ACCESS_COOKIE } from "../utils/tokens.js";
import { setRequestUser } from "./request-context.js";

// Requires a valid short-lived access token (httpOnly cookie,
// or `Authorization: Bearer <token>` for non-browser clients).
// Attaches the user document as `req.user`.
const protect = asyncHandler(async (req, _res, next) => {
    const token = req.cookies?.[ACCESS_COOKIE] ?? req.headers.authorization?.replace(/^Bearer\s+/i, "");

    if (!token) {
        throw new AppError(401, "You are not logged in. Please log in to continue.");
    }

    let decoded;
    try {
        decoded = verifyAccessToken(token);
    } catch {
        throw new AppError(401, "Your session has expired. Please log in again.");
    }

    if (decoded.type !== "access") {
        throw new AppError(401, "Invalid session token. Please log in again.");
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
        throw new AppError(401, "This account no longer exists. Please sign up again.");
    }

    req.user = user;
    // Correlate every later log line in this request with the account.
    setRequestUser(user._id);
    next();
});

export default protect;
