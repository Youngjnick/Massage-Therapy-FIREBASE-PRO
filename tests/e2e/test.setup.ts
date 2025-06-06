// Playwright test setup: ensure window.__E2E_TEST__ is set before app loads
import { test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      window.__E2E_TEST__ = true;
    });
    await use(page);
  },
});

export { expect } from '@playwright/test';
