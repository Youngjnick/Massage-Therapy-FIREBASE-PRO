/* eslint-env node */
/* global process */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 1,
  workers: 1, // Run tests serially for reliability
  globalTimeout: 10 * 60 * 1000, // 10 minutes for the whole suite
  use: {
    baseURL: 'http://localhost:5173/',
    ...devices['Desktop Chrome'],
    headless: false,
    launchOptions: {
      args: [],
    },
    trace: 'on',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [],
        },
        headless: false,
      },
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['iPhone 12'],
        launchOptions: {
          args: [],
        },
        headless: false,
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
