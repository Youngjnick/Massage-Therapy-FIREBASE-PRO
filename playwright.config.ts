import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:5174/Massage-Therapy-FIREBASE-PRO/',
    ...devices['Desktop Chrome'],
  },
});
