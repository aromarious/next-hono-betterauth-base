import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./test-e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },
  projects: [
    // Setup project to authenticate once before all tests
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Use saved auth state
        storageState: ".auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: process.env.CI ? "pnpm dev:e2e:ci" : "pnpm dev:e2e",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
