import { AsyncLocalStorage } from "async_hooks";
import { randomUUID } from "crypto";

// Carries request-scoped values (requestId, userId, method, url) across
// async boundaries so services and models can log with full context
// without threading `req` through every function signature.
export const requestStore = new AsyncLocalStorage();

export const getRequestId = () => requestStore.getStore()?.requestId ?? null;

export const setRequestUser = (userId) => {
    const store = requestStore.getStore();
    if (store && userId) {
        store.userId = String(userId);
    }
};

// Must run before anything that logs (morgan included). Attaches a unique
// id to every request, echoes it back as X-Request-Id so clients can
// correlate, and honors an inbound X-Request-Id for cross-service traces.
const requestContext = (req, res, next) => {
    const inbound = req.headers["x-request-id"];
    const requestId = (Array.isArray(inbound) ? inbound[0] : inbound)?.trim() || randomUUID();
    req.id = requestId;
    res.setHeader("X-Request-Id", requestId);
    requestStore.run({ requestId, userId: null, method: req.method, url: req.originalUrl }, () => next());
};

export default requestContext;
