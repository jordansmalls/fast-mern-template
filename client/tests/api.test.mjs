import assert from "node:assert/strict"
import { afterEach, test } from "node:test"
import { AxiosError, CanceledError } from "axios"
import { api, ApiError, onSessionExpired } from "../src/api/client.js"
import {
  createQueryClient,
  authKey,
  clearSession,
  setSession,
} from "../src/lib/query-client.js"
import { useAuthStore } from "../src/stores/auth.js"

const originalAdapter = api.defaults.adapter
const user = {
  _id: "account-1",
  email: "test@example.com",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}
const account = { success: true, message: "Account loaded.", user }
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const response = (config, data = account) => ({
  config,
  data,
  status: 200,
  statusText: "OK",
  headers: {},
})
function fail(config, status, message) {
  throw new AxiosError(message, "ERR_BAD_RESPONSE", config, null, {
    ...response(config, { success: false, error: "Request failed", message }),
    status,
  })
}

afterEach(() => {
  api.defaults.adapter = originalAdapter
  useAuthStore.setState({ user: null, status: "loading" })
})

test("concurrent and delayed 401s share one refresh and retry with cookies", async () => {
  let refreshes = 0
  let protectedRequests = 0
  api.defaults.adapter = async (config) => {
    assert.equal(config.withCredentials, true)
    if (config.url === "/api/auth/refresh") {
      refreshes++
      await pause(10)
      return response(config)
    }
    if (!config.skipAuthRefresh) protectedRequests++
    if (!config._retried) {
      if (config.url === "/api/slow") await pause(40)
      return fail(config, 401, "Session expired.")
    }
    return response(config)
  }
  const results = await Promise.all([
    api.get("/api/auth/me"),
    api.get("/api/records"),
    api.get("/api/slow"),
  ])
  assert.equal(refreshes, 1)
  assert.equal(protectedRequests, 6)
  assert.ok(results.every((result) => result.data.user.email === user.email))
})

test("invalid login credentials never trigger a refresh", async () => {
  const paths = []
  api.defaults.adapter = async (config) => {
    paths.push(config.url)
    return fail(config, 401, "Invalid email or password.")
  }
  await assert.rejects(
    api.post("/api/auth/login", {}),
    (error) =>
      error instanceof ApiError &&
      error.message === "Invalid email or password."
  )
  assert.deepEqual(paths, ["/api/auth/login"])
})

test("rejected refresh expires the session without a retry loop", async () => {
  const paths = []
  let expired = 0
  const unsubscribe = onSessionExpired(() => expired++)
  api.defaults.adapter = async (config) => {
    paths.push(config.url)
    return fail(config, 401, "Please sign in again.")
  }
  try {
    await assert.rejects(api.get("/api/auth/me"), { status: 401 })
    assert.deepEqual(
      paths,
      globalThis.navigator?.locks
        ? ["/api/auth/me", "/api/auth/me", "/api/auth/refresh"]
        : ["/api/auth/me", "/api/auth/refresh"]
    )
    assert.equal(expired, 1)
  } finally {
    unsubscribe()
  }
})

test("a second unauthorized response expires the session after one retry", async () => {
  let refreshes = 0
  let expired = 0
  const unsubscribe = onSessionExpired(() => expired++)
  api.defaults.adapter = async (config) => {
    if (config.url === "/api/auth/refresh") {
      refreshes++
      return response(config)
    }
    return fail(config, 401, "Access denied.")
  }
  try {
    await assert.rejects(api.get("/api/auth/me"), { status: 401 })
    assert.equal(refreshes, 1)
    assert.equal(expired, 1)
  } finally {
    unsubscribe()
  }
})

test("network and server refresh errors preserve the session for retry", async () => {
  let expired = 0
  const unsubscribe = onSessionExpired(() => expired++)
  api.defaults.adapter = async (config) =>
    config.url === "/api/auth/refresh"
      ? fail(config, 503, "Service unavailable.")
      : fail(config, 401, "Expired.")
  try {
    await assert.rejects(api.get("/api/auth/me"), {
      status: 503,
      message: "Service unavailable.",
    })
    assert.equal(expired, 0)
    api.defaults.adapter = async (config) => {
      throw new AxiosError("Network Error", "ERR_NETWORK", config)
    }
    await assert.rejects(api.get("/health"), {
      status: 0,
      message: "Unable to reach the API. Check your connection and try again.",
    })
  } finally {
    unsubscribe()
  }
})

test("validates envelopes and preserves server-safe messages", async () => {
  api.defaults.adapter = async (config) =>
    response(config, {
      success: false,
      message: "Email is already in use.",
      error: "Conflict",
    })
  await assert.rejects(api.patch("/api/auth/me", {}), {
    message: "Email is already in use.",
  })
  api.defaults.adapter = async (config) =>
    response(config, "<html>Wrong server</html>")
  await assert.rejects(api.get("/health"), { code: "InvalidResponse" })
})

test("canceled requests remain canceled", async () => {
  api.defaults.adapter = async () => {
    throw new CanceledError()
  }
  await assert.rejects(
    api.get("/health"),
    (error) => error instanceof CanceledError
  )
})

test("boot and account mutations synchronize the snapshot and query cache", async () => {
  const client = createQueryClient()
  try {
    await client.fetchQuery({ queryKey: authKey, queryFn: async () => account })
    assert.equal(useAuthStore.getState().status, "authenticated")
    const updated = {
      ...account,
      user: { ...user, email: "updated@example.com" },
    }
    setSession(client, updated)
    assert.deepEqual(client.getQueryData(authKey), updated)
    assert.equal(useAuthStore.getState().user.email, "updated@example.com")
    client.setQueryData(["private-records"], ["secret"])
    client.setQueryData(["health"], { success: true })
    await clearSession(client)
    assert.equal(client.getQueryData(authKey), null)
    assert.equal(client.getQueryData(["private-records"]), undefined)
    assert.ok(client.getQueryData(["health"]))
    assert.equal(useAuthStore.getState().status, "anonymous")
  } finally {
    client.clear()
  }
})

test("failed boot has a retryable error state, not an anonymous session", async () => {
  const client = createQueryClient()
  try {
    await assert.rejects(
      client.fetchQuery({
        queryKey: authKey,
        queryFn: async () => {
          throw new ApiError("Offline")
        },
      })
    )
    assert.equal(useAuthStore.getState().status, "error")
    await client.fetchQuery({ queryKey: authKey, queryFn: async () => account })
    assert.equal(useAuthStore.getState().status, "authenticated")
  } finally {
    client.clear()
  }
})

test("logout cancels a delayed /me so it cannot restore the old user", async () => {
  const client = createQueryClient()
  try {
    setSession(client, account)
    const fetching = client
      .fetchQuery({
        queryKey: authKey,
        staleTime: 0,
        queryFn: async () => {
          await pause(30)
          return account
        },
      })
      .catch(() => {})
    await clearSession(client)
    await fetching
    await pause(40)
    assert.equal(client.getQueryData(authKey), null)
    assert.equal(useAuthStore.getState().user, null)
  } finally {
    client.clear()
  }
})
