import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './playwright/isolated',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  timeout: 180_000,
  expect: { timeout: 15_000 },
  outputDir: '/artifacts/test-results',
  reporter: [['line'], ['html', { outputFolder: '/artifacts/report', open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://web:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Only the job-local S3 endpoint has a throwaway self-signed certificate.
    ignoreHTTPSErrors: true,
    launchOptions: {
      args: ['--unsafely-treat-insecure-origin-as-secure=http://web:5173'],
    },
  },
});
