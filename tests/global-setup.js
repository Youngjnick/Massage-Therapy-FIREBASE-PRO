// Playwright global setup: set baseURL for Playwright tests based on the Vite dev server port
/**
 * Playwright global setup: set baseURL dynamically from Vite dev server port
 * @param {import('@playwright/test').FullConfig} config
 */
export default async (config) => {
  // Always use port 1234 for Playwright tests
  const baseURL = `http://localhost:1234`;
  config.projects.forEach((project) => {
    if (!project.use) project.use = {};
    project.use.baseURL = baseURL;
  });
  console.log(`[Playwright global-setup] baseURL set to: ${baseURL}`);
};

// Clean up E2E test hooks after each test to prevent state leakage
// Note: Playwright does not support afterEach in global setup, so this should be in test setup files if needed.
