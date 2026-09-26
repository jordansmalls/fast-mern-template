import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev --port 3000",
    url: "http://localhost:3000/login",
    reuseExistingServer: !process.env.CI,
    env: { NEXT_PUBLIC_API_URL: "http://localhost:9999" },
  },
})
