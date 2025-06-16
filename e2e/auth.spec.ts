// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe('Authentication UI Flows', () => {
  test('should show sign-in prompt on Analytics when unauthenticated', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.getByText(/please sign in to view your analytics/i)).toBeVisible();
  });

  test('should show sign-in button and open popup on Profile page', async ({ page, context }) => {
    await page.goto('/profile');
    const signInBtn = page.getByRole('button', { name: /sign in with google/i });
    await expect(signInBtn).toBeVisible();

    // Listen for popup event
    let popupOpened = false;
    context.once('page', () => {
      popupOpened = true;
    });
    await signInBtn.click();
    // Wait a moment for popup
    await page.waitForTimeout(1000);
    expect(popupOpened).toBe(true);
  });

  test('should show sign-in button after sign out click (UI only)', async ({ page }) => {
    await page.goto('/profile');
    const signInBtn = page.getByRole('button', { name: /sign in with google/i });
    await expect(signInBtn).toBeVisible();
    // Simulate clicking sign out (if present)
    const signOutBtn = page.getByRole('button', { name: /sign out/i });
    if (await signOutBtn.count()) {
      await signOutBtn.click();
      await expect(signInBtn).toBeVisible();
    }
  });
});
