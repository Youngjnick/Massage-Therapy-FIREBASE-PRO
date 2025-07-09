/* eslint-env node */
/* global process */

import { defineConfig, devices } from '@playwright/test';

console.log('[DEBUG] PW_HEADLESS:', process.env.PW_HEADLESS);

export default defineConfig({
  testDir: './e2e',
  timeout: process.env.CI ? 30000 : 15000,  // Shorter timeout for WIP
  retries: 0,  // No retries in WIP mode
  workers: process.env.CI ? undefined : 4,  // Force 4 workers in WIP mode
  globalTimeout: process.env.CI ? 10 * 60 * 1000 : 5 * 60 * 1000,  // Shorter global timeout for WIP
  outputDir: 'test-results/screenshots',
  fullyParallel: true,
  forbidOnly: false,  // Allow .only in WIP mode
  maxFailures: 1,  // Stop on first failure in WIP mode
  use: {
    baseURL: 'http://localhost:5173/',
    headless: process.env.PW_HEADLESS === '1',
    launchOptions: {
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-sandbox',
        '--js-flags=--expose-gc',
        '--disable-extensions',
        '--disable-component-extensions-with-background-pages',
        '--disable-default-apps',
        '--no-default-browser-check',
        '--disable-sync',
        '--disable-site-isolation-trials',
        '--disable-features=IsolateOrigins,site-per-process'
      ],
      timeout: process.env.CI ? 30000 : 10000,
      ignoreDefaultArgs: ['--enable-automation']
    },
    trace: 'off',
    screenshot: process.env.CI ? 'only-on-failure' : 'off',
    video: 'off',
    actionTimeout: process.env.CI ? 15000 : 5000,
    navigationTimeout: process.env.CI ? 15000 : 5000,
    testIdAttribute: 'data-testid',
    bypassCSP: true,  // Skip Content Security Policy checks
    ignoreHTTPSErrors: true  // Ignore HTTPS errors
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--no-sandbox',
            '--js-flags=--expose-gc'
          ]
        },
        headless: process.env.PW_HEADLESS === '1',
        viewport: { width: 1280, height: 720 }
      }
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['iPhone 12'],
        launchOptions: {
          args: [
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--no-sandbox',
            '--js-flags=--expose-gc'
          ]
        },
        headless: process.env.PW_HEADLESS === '1'
      }
    }
  ],
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['html', { open: 'never' }]
  ],
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixels: 100
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.1
    }
  },
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: undefined
});
