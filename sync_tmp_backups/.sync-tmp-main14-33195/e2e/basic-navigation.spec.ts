import { test, expect } from '@playwright/test';
import './helpers/playwright-coverage';

const pages = [
  { path: '/', selector: 'body' },
  { path: '/quiz', selector: '[data-testid="quiz-start-form"], body' },
  { path: '/analytics', selector: 'h1, body' },
  { path: '/profile', selector: 'h1, body' },
  // Add more pages/selectors as needed
];

test.describe('Basic Navigation', () => {
  for (const { path, selector } of pages) {
    test(`can navigate to ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator(selector)).toBeVisible({ timeout: 10000 });
    });
  }
});
