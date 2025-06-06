import { test, expect, Page } from '@playwright/test';

test.describe('Settings modal', () => {
  // Helper for sign-in
  async function signIn(page: Page) {
    await page.goto('/');
    await page.fill('input[type="email"]', 'testuser@gmail.com');
    await page.fill('input[type="password"]', 'testpassword123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('img[alt="Profile"], img[alt="User Avatar"], #mainProfileAvatar')).toBeVisible();
  }

  test('opens and closes from header and profile modal', async ({ page }) => {
    await signIn(page);
    // Open from header
    await page.getByTestId('settings-link').click();
    await expect(page.getByTestId('settings-modal')).toBeVisible();
    await page.getByTestId('close-settings-modal').click();
    await expect(page.getByTestId('settings-modal')).not.toBeVisible();
    // Open profile modal
    await page.getByTestId('profile-btn').click();
    await expect(page.getByTestId('profile-modal')).toBeVisible();
    await page.getByTestId('settings-link').click();
    await expect(page.getByTestId('settings-modal')).toBeVisible();
  });
});
