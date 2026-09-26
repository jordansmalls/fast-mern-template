// @ts-check
import axios from "axios"

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:9999"
).replace(/\/+$/, "")

export class ApiError extends Error {
  /** @param {string} message @param {number} [status] @param {string} [code] */
  constructor(message, status = 0, code = "RequestFailed") {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

/** @param {unknown} error */
export function getErrorMessage(error) {
  return error instanceof ApiError
    ? error.message
    : "Something went wrong. Please try again."
}

/** @param {unknown} error */
function normalizeError(error) {
  if (error instanceof ApiError) return error
  if (axios.isAxiosError(error)) {
    const body = error.response?.data
    return new ApiError(
      typeof body?.message === "string"
        ? body.message
        : error.response
          ? "The request could not be completed. Please try again."
          : "Unable to reach the API. Check your connection and try again.",
      error.response?.status,
      typeof body?.error === "string" ? body.error : error.code
    )
  }
  return new ApiError("Something went wrong. Please try again.")
}

/** @typedef {import('axios').InternalAxiosRequestConfig & { skipAuthRefresh?: boolean, _retried?: boolean, _generation?: number }} AuthConfig */
/** @type {Set<() => void>} */
const expiredListeners = new Set()
/** @param {() => void} listener */
export function onSessionExpired(listener) {
  expiredListeners.add(listener)
  return () => {
    expiredListeners.delete(listener)
  }
}

// All API traffic, including refresh, uses this instance. Cookies stay in the browser.
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15_000,
  headers: { Accept: "application/json" },
})

let generation = 0
/** @type {Promise<void> | null} */
let refreshPromise = null
const publicPaths = new Set([
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
  "/api/auth/refresh",
  "/api/auth/email-available",
  "/health",
])

api.interceptors.request.use((config) => {
  const request = /** @type {AuthConfig} */ (config)
  request._generation = generation
  return request
})

/** Wait before logout/login so an in-flight refresh cannot overwrite their cookies. */
export async function waitForRefresh() {
  await refreshPromise?.catch(() => {})
}

async function rotateSession() {
  // A second tab may already have rotated the single-use token while we waited.
  // Web Locks serializes refreshes across tabs on this client origin.
  if (typeof navigator !== "undefined" && navigator.locks) {
    await navigator.locks.request(`auth-refresh:${API_URL}`, async () => {
      try {
        await api.get(
          "/api/auth/me",
          /** @type {AuthConfig} */ ({ skipAuthRefresh: true })
        )
        return
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error
      }
      await api.post("/api/auth/refresh")
    })
  } else {
    await api.post("/api/auth/refresh")
  }
  generation += 1
}

api.interceptors.response.use(
  (response) => {
    if (response.data?.success !== true) {
      throw new ApiError(
        typeof response.data?.message === "string"
          ? response.data.message
          : "The API returned an unexpected response.",
        response.status,
        response.data?.error || "InvalidResponse"
      )
    }
    return response
  },
  async (error) => {
    if (axios.isCancel(error)) throw error
    const request = /** @type {AuthConfig | undefined} */ (error.config)
    const normalized = normalizeError(error)
    if (
      normalized.status !== 401 ||
      !request ||
      request.skipAuthRefresh ||
      publicPaths.has(request.url?.split("?")[0] || "")
    ) {
      throw normalized
    }
    if (request._retried) {
      expiredListeners.forEach((listener) => listener())
      throw normalized
    }
    request._retried = true
    try {
      // A delayed 401 from the old access token should use the freshly rotated cookie.
      if (request._generation === generation) {
        if (!refreshPromise) {
          refreshPromise = rotateSession().finally(() => {
            refreshPromise = null
          })
        }
        await refreshPromise
      }
    } catch (refreshError) {
      const failure = normalizeError(refreshError)
      if (failure.status === 401)
        expiredListeners.forEach((listener) => listener())
      throw failure
    }
    return api.request(request)
  }
)
