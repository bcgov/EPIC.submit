import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./playwright/mui-smoke",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: [["list"], ["html", { outputFolder: "playwright-report/mui-smoke", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:5189",
    timezoneId: "America/Vancouver",
    contextOptions: { reducedMotion: "reduce" },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "npm run build:ui-contracts && vite preview --config playwright/mui-smoke/vite.config.ts --host 127.0.0.1 --port 5189 --strictPort",
    url: "http://127.0.0.1:5189",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
