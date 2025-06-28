import { test, expect } from '@playwright/test';
import { uiSignIn } from './helpers/uiSignIn';

test('auth smoke: can sign in and see user info', async ({ page }) => {
  await uiSignIn(page);
  await page.goto('/profile');
  // Assert the sign-out button is visible as proof of sign-in
  await expect(page.locator('button[aria-label="Sign out"], button:has-text("Sign Out")')).toBeVisible({ timeout: 5000 });
});
