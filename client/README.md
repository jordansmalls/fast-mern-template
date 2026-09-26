# API client template

A Next.js client for the Express API in `../server`. The API owns authentication and data. The client never reads or stores access or refresh tokens.

## Run locally

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

`NEXT_PUBLIC_API_URL` defaults to `http://localhost:9999`. Use the server origin without `/api`. Restart the dev server after changing it; rebuild for production because Next.js embeds public environment variables in the client bundle. The API URL is deployment configuration, not an account preference. Settings displays it and can test the connection.

Start the server separately using `../server/README.md`. Set its `FRONTEND_URL` to the exact client origin, normally `http://localhost:3000`, so credentialed CORS requests work. Use the same hostname on both sides locally; do not mix `localhost` and `127.0.0.1`. Use HTTPS and the server's appropriate cookie settings in production. The client cannot override cookie or CORS policy.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Protected dashboard with live health and account details |
| `/settings` | Shared sidebar, API connection test, email/password updates, account deletion |
| `/login`, `/signup` | Email/password authentication |
| `/dashboard` | Redirect to `/` for existing links |
| `/terms`, `/privacy` | Public placeholder text to customize before launch |
| Any unknown path | Public 404 |

## Data flow

- `src/api/client.js` exports the only axios instance. Every request includes `withCredentials: true`. It validates the JSON envelope and exposes display-safe `ApiError` messages.
- `src/hooks/useAuth.js` is the component-facing auth API: `useAuth`, `useLogin`, `useSignup`, `useLogout`, `useUpdateAccount`, `useDeleteAccount`, and `useEmailAvailable`. Components do not import axios.
- `src/hooks/useHealth.js` owns health fetching and polls every 30 seconds while its view is active. Both dashboard and settings share the query cache.
- `components/api-provider.tsx` creates a QueryClient and boots `GET /api/auth/me`. Query cache callbacks hydrate the in-memory Zustand auth snapshot. Guards read that snapshot synchronously, with explicit loading and connection-error states.
- Auth mutations update both Query and Zustand from the server response. Account changes cancel old `/me` reads. Logout/deletion cancel queries and remove account-scoped caches before clearing the snapshot. Failed logout keeps the session visible for retry.
- Zustand contains only a user snapshot, auth readiness, and sidebar state. API data stays in Query; form fields stay local. Nothing sensitive is persisted in browser storage.

### Session refresh

A protected request returning 401 waits for one shared refresh, then retries once. Public auth requests never auto-refresh, so invalid login credentials remain a login error. Delayed 401s reuse a refresh already completed in that tab. When available, Web Locks coordinate refreshes across tabs on the same client origin; a `/me` probe inside the lock avoids reusing a rotated token. Browsers without Web Locks coordinate within each tab only.

Refresh 401s clear the local session. Network errors, rate limits, and server failures remain retryable errors and do not silently sign the user out. Mutations never automatically retry except for the single replay after authentication refresh. The server rejects unauthorized requests before applying changes.

These client guards control navigation only. Protected API endpoints must enforce authentication on the server. The boilerplate has one refresh session per account, so another login can invalidate an older refresh session.

### Add an API feature

1. Add a hook under `src/hooks` using the shared `api` instance and a distinct Query key.
2. Pass Query's `signal` to axios so sign-out can cancel requests.
3. Read data through that hook, and invalidate or update its cache after mutations.
4. Keep server records out of Zustand. Private query caches are removed when the session ends; only health is retained.

```tsx
import { useUpdateAccount } from "@/src/hooks/useAuth"

const updateAccount = useUpdateAccount()
updateAccount.mutate({ email: "you@example.com" })
```

Sonner is mounted once and available via `import { toast } from "sonner"`. API mutation errors appear in Sonner toasts. Field validation and successful account updates use inline feedback.

## Customize

Replace Acme branding in the sidebar/auth forms and legal page metadata. Replace all terms/privacy placeholder text with your product's actual policies. The template has no OAuth buttons or endpoints. Reusable shadcn components remain under `components/ui`; sample charts, tables, and their demo data have been removed from the dashboard.

## Checks

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build
```

Unit tests cover refresh coordination, error envelopes, cache/store synchronization, and cancellation during sign-out. Browser tests intercept the API with deterministic responses, so they do not create or delete real accounts. They cover login, signup, account changes, deletion confirmation, connection failures, public pages, and mobile navigation. They use port 3000 and may reuse a local dev server with the default API URL. A real server smoke test is still needed to verify your deployed CORS, cookie, and database configuration.

ESLint is pinned to the 9.x line supported by the current Next.js React lint plugins; the previous ESLint 10 configuration crashed those plugins.

References: [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview), [axios interceptors](https://axios-http.com/docs/interceptors), [Zustand](https://zustand.docs.pmnd.rs/reference/apis/create).
