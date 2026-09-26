# Express Backend Boilerplate

Express + MongoDB starter with JWT cookie auth (short-lived access + rotating refresh pair), centralized logging, validation, and rate limiting.

## Quick start

```bash
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, FRONTEND_URL
pnpm install
pnpm dev               # nodemon + hot reload
pnpm start             # production
```

## Auth model

- `POST /api/auth/signup` — create account (email + password, min 8 chars). Sets both auth cookies.
- `POST /api/auth/login` — sets both auth cookies.
- `POST /api/auth/refresh` — rotates the refresh token (single-use), sets fresh cookies.
- `POST /api/auth/logout` — revokes the stored refresh token and clears cookies.
- `GET /api/auth/me` — current account (access token required).
- `PATCH /api/auth/me` — update email and/or password.
- `DELETE /api/auth/me` — delete account, clears cookies.
- `GET /api/auth/email-available?email=a@b.com` — `200 { available: true }` or `409` if taken.
- `GET /health` — liveness probe with DB status.

Auth uses `httpOnly` cookies (`accessToken` 15m, `refreshToken` 7d by default). In production cookies are `secure` + `sameSite=strict`, so the frontend must call the API with `credentials: "include"` and `FRONTEND_URL` must be the exact origin.

> Note: logout clears cookies client-side and revokes the refresh token server-side. There is no access-token blacklist — a stolen access token stays valid until its short expiry. This is the documented trade-off of the stateless access-token design.

## Response shape

```json
{ "success": true, "message": "For display on the frontend", "user": { "_id": "...", "email": "..." } }
```

Errors: `{ "success": false, "error": "Short label", "message": "Display-safe message" }`.

Throw `new AppError(statusCode, message)` anywhere and the central handler formats it. Mongo duplicate-key (`E11000`) becomes a clean `409`.

## Structure

```
src/
  app.js               # middleware stack + route mounting
  server.js            # config validation, DB connect, listen
  config/              # config, db, logger (winston + morgan + chalk)
  models/user.js       # email-normalized, bcrypt-hashed user
  controllers/         # template-shaped req/res only (auth-controller)
  services/            # business logic (auth-service)
  routes/              # auth-routes, health-routes
  middleware/          # auth, sanitize, validators, validate, rate-limit, error-handler, request-context
  utils/               # app-error, async-handler, tokens/cookies, redact
```

## Logging

One stream (winston + morgan piped in), same fields everywhere. Rendered
pretty in development, JSON in production — only the rendering differs:

```json
{
    "timestamp": "...",
    "level": "info",
    "message": "auth.login",
    "requestId": "...",
    "userId": "...",
    "method": "POST",
    "url": "/api/auth/login",
    "meta": {}
}
```

- `requestId` is generated per request (`crypto.randomUUID()`), stored on `req.id`, echoed back as `X-Request-Id`, and propagated via `AsyncLocalStorage` — services log correlated lines without receiving `req`. Send your own `X-Request-Id` to continue a trace across services.
- `userId` attaches once authenticated (auth middleware, login/signup/refresh).
- `meta` holds event data and is scrubbed by a shared redactor (`utils/redact.js`): passwords, tokens, cookies, and auth headers become `[REDACTED]`. Convention: always put extra fields under `meta`.
- Mutations log diffs, not documents: signup/login/logout/refresh/delete log ids + email; account updates log `{ email: { from, to }, password: "changed" }`. Failed logins log a warn with the email (no password, ever).
- Errors log through the same handler with the same `requestId` (stack attached on 5xx only), so a failure correlates with its request trace.
- Destinations: console now; set `LOG_FILE` to also persist to disk, or add a Datadog/Better Stack transport in `config/logger.js` — call sites stay untouched.

## Security stack

helmet, cors (credentials + fixed origin), express-rate-limit (100/15min general, 20/15min auth), express-mongo-sanitize, express-validator, bcrypt (cost 12), compression.
