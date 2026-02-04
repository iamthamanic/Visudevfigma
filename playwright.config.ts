import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E config for VisuDEV (T2-020).
 * Run: npx playwright test
 * CI: build + vite preview, then playwright test --config=playwright.config.ts
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["html"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.CI
    ? {
        command: "npm run build && npx vite preview --port 3000",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: false,
        timeout: 120000,
      }
    : undefined,
});
