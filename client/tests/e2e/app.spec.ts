import { test, expect, type Page } from "@playwright/test"

async function mockApi(
  page: Page,
  { signedIn = true, offline = false, expired = false } = {}
) {
  let authenticated = signedIn
  let accessExpired = expired
  let unavailable = offline
  let database = "connected"
  let healthUnavailable = false
  let refreshes = 0
  let user = {
    _id: "account-123",
    email: "member@example.com",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  }
  const requests: {
    method: string
    path: string
    body?: Record<string, string>
  }[] = []
  await page.route("http://localhost:9999/**", async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    const method = request.method()
    const body = request.postDataJSON()
    requests.push({ method, path, body })
    if (unavailable || (healthUnavailable && path === "/health"))
      return route.abort("connectionrefused")
    const send = (status: number, data: object) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(data),
      })
    const ok = (extra: object = {}) =>
      send(200, { success: true, message: "Request completed.", ...extra })
    const fail = (status: number, message: string) =>
      send(status, { success: false, error: "Request failed", message })
    if (path === "/health")
      return ok({
        database,
        environment: "test",
        uptime: 3661,
        timestamp: "2026-09-26T12:00:00Z",
      })
    if (path === "/api/auth/email-available")
      return new URL(request.url()).searchParams.get("email") ===
        "taken@example.com"
        ? fail(409, "That email is already in use.")
        : ok({ available: true })
    if (path === "/api/auth/login" || path === "/api/auth/signup") {
      if (body.password === "wrongpass")
        return fail(401, "Invalid email or password.")
      authenticated = true
      accessExpired = false
      user = { ...user, email: body.email }
      return ok({ user })
    }
    if (path === "/api/auth/refresh") {
      refreshes++
      if (!authenticated) return fail(401, "Please log in again.")
      accessExpired = false
      return ok({ user })
    }
    if (path === "/api/auth/logout") {
      authenticated = false
      return ok()
    }
    if (path === "/api/auth/me") {
      if (!authenticated || accessExpired)
        return fail(401, "Please log in again.")
      if (method === "PATCH") {
        if (body.email === "taken@example.com")
          return fail(409, "That email is already in use.")
        user = {
          ...user,
          ...(body.email ? { email: body.email } : {}),
          updatedAt: "2026-09-26T13:00:00Z",
        }
      }
      if (method === "DELETE") {
        authenticated = false
        return ok()
      }
      return ok({ user })
    }
    return fail(404, "Not found.")
  })
  return {
    requests,
    refreshes: () => refreshes,
    online: () => {
      unavailable = false
    },
    disconnectDatabase: () => {
      database = "disconnected"
    },
    disconnectHealth: () => {
      healthUnavailable = true
    },
  }
}

test("dashboard consumes health, shares settings sidebar, and updates the account", async ({
  page,
}, testInfo) => {
  const api = await mockApi(page)
  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true })
  ).toBeVisible()
  await expect(page.getByText("Operational", { exact: true })).toBeVisible()
  await expect(page.getByText("1h 1m")).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath("dashboard.png"),
    fullPage: true,
  })
  await page.getByRole("link", { name: "Settings", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "Settings", exact: true })
  ).toBeVisible()
  await page.screenshot({
    path: testInfo.outputPath("settings.png"),
    fullPage: true,
  })
  await page
    .getByLabel("Email address", { exact: true })
    .fill("updated@example.com")
  await page.getByRole("button", { name: "Update email" }).click()
  await expect(
    page.getByRole("status").filter({ hasText: "Request completed." })
  ).toBeVisible()
  await expect(
    page.getByText("updated@example.com", { exact: true })
  ).toBeVisible()
  await page.getByLabel("New password", { exact: true }).fill("newpassword")
  await page.getByLabel("Confirm new password").fill("different")
  await page.getByRole("button", { name: "Update password" }).click()
  await expect(
    page.getByRole("alert").filter({ hasText: "Passwords do not match." })
  ).toHaveText("Passwords do not match.")
  expect(api.requests.filter((r) => r.method === "PATCH")).toHaveLength(1)
  await page.getByLabel("Confirm new password").fill("newpassword")
  await page.getByRole("button", { name: "Update password" }).click()
  await expect(page.getByLabel("New password", { exact: true })).toHaveValue("")
  expect(
    api.requests.find((r) => r.body?.password === "newpassword")?.body
  ).toEqual({ password: "newpassword" })
  await page.getByRole("link", { name: "Dashboard", exact: true }).click()
  await expect(
    page.getByRole("definition").filter({ hasText: "updated@example.com" })
  ).toBeVisible()
  await page.getByRole("button", { name: "Account menu", exact: true }).click()
  await page.getByRole("menuitem", { name: "Log out", exact: true }).click()
  await expect(page).toHaveURL(/\/login/)
  await expect(
    page.getByRole("heading", { name: "Welcome back" })
  ).toBeVisible()
})

test("guards settings, displays login errors, and restores the intended route", async ({
  page,
}) => {
  const api = await mockApi(page, { signedIn: false })
  await page.goto("/settings")
  await expect(page).toHaveURL(/\/login\?next=%2Fsettings/)
  await page.getByLabel("Email", { exact: true }).fill("member@example.com")
  await page.getByLabel("Password", { exact: true }).fill("wrongpass")
  const refreshCount = api.refreshes()
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(
    page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "Invalid email or password." })
  ).toHaveText("Invalid email or password.")
  expect(api.refreshes()).toBe(refreshCount)
  await page.getByLabel("Password", { exact: true }).fill("correctpass")
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page).toHaveURL("/settings")
  await expect(
    page.getByRole("heading", { name: "Settings", exact: true })
  ).toBeVisible()
})

test("signup checks availability and validates password confirmation", async ({
  page,
}) => {
  const api = await mockApi(page, { signedIn: false })
  await page.goto("/signup")
  await page.getByLabel("Email", { exact: true }).fill("taken@example.com")
  await page.getByLabel("Password", { exact: true }).focus()
  await expect(page.getByText("That email is already in use.")).toBeVisible()
  await page.getByLabel("Email", { exact: true }).fill("new@example.com")
  await page.getByLabel("Password", { exact: true }).fill("newpassword")
  await page.getByLabel("Confirm password").fill("different")
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click()
  await expect(
    page.getByRole("alert").filter({ hasText: "Passwords do not match." })
  ).toHaveText("Passwords do not match.")
  expect(api.requests.some((r) => r.path === "/api/auth/signup")).toBe(false)
  await page.getByLabel("Confirm password").fill("newpassword")
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click()
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true })
  ).toBeVisible()
})

test("refreshes an expired session once during boot", async ({ page }) => {
  const api = await mockApi(page, { expired: true })
  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true })
  ).toBeVisible()
  expect(api.refreshes()).toBe(1)
})

test("boot connection failures can be retried without redirecting to login", async ({
  page,
}) => {
  const api = await mockApi(page, { offline: true })
  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "Unable to load your account" })
  ).toBeVisible()
  await expect(page).toHaveURL("/")
  api.online()
  await page.getByRole("button", { name: "Try again" }).click()
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true })
  ).toBeVisible()
})

test("health distinguishes database failures and stale results", async ({
  page,
}) => {
  const api = await mockApi(page)
  await page.goto("/")
  await expect(page.getByText("Operational", { exact: true })).toBeVisible()
  api.disconnectDatabase()
  await page.getByRole("button", { name: "Refresh", exact: true }).click()
  await expect(
    page.getByText("Database unavailable", { exact: true })
  ).toBeVisible()
  api.disconnectHealth()
  await page.getByRole("button", { name: "Refresh", exact: true }).click()
  await expect(
    page.getByText("Last known status", { exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("alert").filter({ hasText: "Unable to check the service" })
  ).toContainText("Showing the last successful check")
})

test("deletion requires confirmation and clears the session", async ({
  page,
}) => {
  const api = await mockApi(page)
  await page.goto("/settings")
  await page
    .getByRole("button", { name: "Delete account", exact: true })
    .click()
  await expect(
    page.getByRole("button", { name: "Permanently delete account" })
  ).toBeDisabled()
  await page.getByRole("button", { name: "Cancel", exact: true }).click()
  expect(api.requests.some((r) => r.method === "DELETE")).toBe(false)
  await page
    .getByRole("button", { name: "Delete account", exact: true })
    .click()
  await page.getByLabel("Type DELETE to confirm").fill("DELETE")
  await page.getByRole("button", { name: "Permanently delete account" }).click()
  await expect(
    page.getByRole("heading", { name: "Welcome back" })
  ).toBeVisible()
  expect(api.requests.filter((r) => r.method === "DELETE")).toHaveLength(1)
})

test("legal and 404 pages remain public while API is unavailable", async ({
  page,
}) => {
  await mockApi(page, { offline: true })
  for (const [path, title] of [
    ["/terms", "Terms of Service"],
    ["/privacy", "Privacy Policy"],
    ["/does-not-exist", "Page not found"],
  ]) {
    await page.goto(path)
    await expect(
      page.getByRole("heading", { name: title, exact: true })
    ).toBeVisible()
  }
})

test("mobile sidebar navigates to settings and closes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockApi(page)
  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true })
  ).toBeVisible()
  await page.getByRole("button", { name: "Toggle Sidebar" }).click()
  await page.getByRole("link", { name: "Settings", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "Settings", exact: true })
  ).toBeVisible()
  await expect(page.getByRole("dialog")).not.toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true)
})
