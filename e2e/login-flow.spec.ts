import { test, expect } from '@playwright/test';
import { uiSignIn } from './helpers/uiSignIn';

test.describe('Sign In Flow (UI)', () => {
  test('shows sign-in prompt when not authenticated', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();
    await expect(page.getByText(/guest/i)).toBeVisible();
  });

  test('signs in with test form and shows user profile', async ({ page }) => {
    await uiSignIn(page);
    await page.goto('/profile');
    await page.waitForSelector('button[aria-label="Sign out"], button:has-text("Sign Out")', { timeout: 10000 });
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
    await expect(page.getByText(/guest/i)).not.toBeVisible();
  });

  test('signs out and returns to guest state', async ({ page }) => {
    await uiSignIn(page);
    await page.goto('/profile');
    await page.waitForSelector('button[aria-label="Sign out"], button:has-text("Sign Out")', { timeout: 10000 });
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();
    await expect(page.getByText(/guest/i)).toBeVisible();
  });
});
