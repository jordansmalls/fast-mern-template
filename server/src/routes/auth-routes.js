import { Router } from "express";
import protect from "../middleware/auth.js";
import { authLimiter } from "../middleware/rate-limit.js";
import validate from "../middleware/validate.js";
import {
    signupValidators,
    loginValidators,
    updateMeValidators,
    emailAvailableValidators,
} from "../middleware/validators.js";
import {
    signup,
    login,
    refresh,
    logout,
    getMe,
    updateMe,
    deleteMe,
    checkEmailAvailable,
} from "../controllers/auth-controller.js";

const router = Router();

// Brute-force surface: signup/login/refresh/email-check share the strict limiter.
router.post("/signup", authLimiter, signupValidators, validate, signup);
router.post("/login", authLimiter, loginValidators, validate, login);
router.post("/refresh", authLimiter, refresh);
router.get("/email-available", authLimiter, emailAvailableValidators, validate, checkEmailAvailable);

// Logout revokes the refresh token (when present/valid) and always
// clears cookies — intentionally no `protect`, so it works with an
// expired access token too.
router.post("/logout", logout);

router.get("/me", protect, getMe);
router.patch("/me", protect, updateMeValidators, validate, updateMe);
router.delete("/me", protect, deleteMe);

export default router;
