import { test, expect } from '@playwright/test';

test('should load the homepage and display the main heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1, h2, h3')).toHaveText(/quiz|massage|study/i, { useInnerText: true });
});
