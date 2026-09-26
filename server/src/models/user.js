import bcrypt from "bcrypt";
import { createHash } from "crypto";
import mongoose from "mongoose";
import config from "../config/config.js";

export const normalizeEmail = (email) => email.trim().toLowerCase();

// bcrypt only sees the first 72 bytes — a raw JWT's prefix (header + sub)
// is identical across tokens, so hash a SHA-256 digest instead. The digest
// carries full entropy in every byte, keeping compare sound.
const sha256Hex = (value) => createHash("sha256").update(value).digest("hex");

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true,
            maxlength: [254, "Email is too long"],
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters long"],
            select: false,
        },
        // bcrypt hash of the current refresh token. Rotation replaces it;
        // logout clears it. Single-session template: logging in elsewhere
        // invalidates older sessions.
        refreshTokenHash: {
            type: String,
            default: null,
            select: false,
        },
    },
    { timestamps: true },
);

// Lowercase + trim on save so the unique index and the
// email-availability endpoint can never disagree on casing.
userSchema.pre("save", async function (next) {
    if (this.isModified("email") && typeof this.email === "string") {
        this.email = normalizeEmail(this.email);
    }
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, config.bcryptSaltRounds);
    }
    next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.compareRefreshToken = function (candidateToken) {
    if (!this.refreshTokenHash) return false;
    return bcrypt.compare(sha256Hex(candidateToken), this.refreshTokenHash);
};

userSchema.methods.setRefreshToken = async function (token) {
    this.refreshTokenHash = await bcrypt.hash(sha256Hex(token), config.bcryptSaltRounds);
};

userSchema.methods.toSafeObject = function () {
    return {
        _id: this._id,
        email: this.email,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
