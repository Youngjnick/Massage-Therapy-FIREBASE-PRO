import { test, expect } from '@playwright/test';

test('signs in as test user', async ({ page }) => {
  await page.goto('/'); // or your login page route

  // E2E: skip manual sign-in, mock auth is always used

  // Wait for a selector that confirms login (replace with your dashboard/profile selector if needed)
  await expect(page.locator('img[alt="Profile"], img[alt="User Avatar"], #mainProfileAvatar')).toBeVisible();

  // ...continue with your test steps
});