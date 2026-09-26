// Shared sanitizer: runs over every winston `meta` object before it is
// logged, so passwords, tokens, and auth headers can never leak into logs
// (notably on the update-account route). Convention: put all extra log
// data under `meta` — top-level info fields are NOT scrubbed.
const SENSITIVE_PATTERNS = [
    "password",
    "passwd",
    "secret",
    "token",
    "authorization",
    "cookie",
    "credential",
    "apikey",
    "sessionid",
];

const isSensitiveKey = (key) => {
    const normalized = key.toLowerCase().replace(/[_-]/g, "");
    return SENSITIVE_PATTERNS.some((pattern) => normalized.includes(pattern));
};

export function sanitizeLog(value, seen = new WeakSet()) {
    if (Array.isArray(value)) {
        return value.map((item) => sanitizeLog(item, seen));
    }
    if (value && typeof value === "object") {
        // ObjectId, Date, and friends: serialize to their JSON form instead
        // of leaking BSON internals (e.g. { buffer: {...} }) into logs.
        if (typeof value.toJSON === "function") {
            try {
                return sanitizeLog(value.toJSON(), seen);
            } catch {
                return "[Unserializable]";
            }
        }
        if (seen.has(value)) {
            return "[Circular]";
        }
        seen.add(value);
        const clean = {};
        for (const [key, nested] of Object.entries(value)) {
            clean[key] = isSensitiveKey(key) ? "[REDACTED]" : sanitizeLog(nested, seen);
        }
        return clean;
    }
    return value;
}
