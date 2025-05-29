// @ts-check

import { devices } from '@playwright/test';
import { defineConfig } from '@playwright/test';
import path from 'path';

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  use: {
    headless: false, // Set to true for CI and reliability
    // baseURL will be set dynamically in globalSetup
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  workers: 1, // Limit to 1 worker for stability
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npx vite --port 1234', // Start Vite on fixed port 1234
    port: 1234, // Use the same port as app and tests
    timeout: 300 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  globalSetup: './tests/global-setup.js',
});

export default config;
