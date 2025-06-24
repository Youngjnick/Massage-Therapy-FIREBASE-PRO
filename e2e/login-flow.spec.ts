import { test, expect } from '@playwright/test';
import { generateTokenAndSignIn } from './helpers/generateAndSignIn';

test.describe('Sign In Flow (Mocked)', () => {
  test('shows sign-in prompt when not authenticated', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();
    await expect(page.getByText(/guest/i)).toBeVisible();
  });

  test('signs in with mock and shows user profile', async ({ page }) => {
    await generateTokenAndSignIn(page);
    await page.goto('/profile');
    // Should show sign out button and not show sign in
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
    await expect(page.getByText(/guest/i)).not.toBeVisible();
    // Optionally check for user display name or avatar
  });

  test('signs out and returns to guest state', async ({ page }) => {
    await generateTokenAndSignIn(page);
    await page.goto('/profile');
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();
    await expect(page.getByText(/guest/i)).toBeVisible();
  });
});
