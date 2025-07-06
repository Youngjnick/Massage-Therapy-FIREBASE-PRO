/* eslint-env node */
/* global process */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 1,
  workers: 1, // Run tests serially for reliability
  globalTimeout: 10 * 60 * 1000, // 10 minutes for the whole suite
  outputDir: 'test-results/screenshots',
  use: {
    baseURL: 'http://localhost:5173/',
    ...devices['Desktop Chrome'],
    headless: process.env.PW_HEADLESS === '1',
    launchOptions: {
      args: [],
    },
    trace: 'on',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [],
        },
        headless: process.env.PW_HEADLESS === '1',
        screenshot: 'only-on-failure',
      },
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['iPhone 12'],
        launchOptions: {
          args: [],
        },
        headless: process.env.PW_HEADLESS === '1',
        screenshot: 'only-on-failure',
      },
    },
  ],
  globalSetup: './e2e/global-setup.ts',
  webServer: {
    command: 'cp .env.e2e .env && vite --port 5173',
    port: 5173,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  // Print headed/headless mode at config load
});
