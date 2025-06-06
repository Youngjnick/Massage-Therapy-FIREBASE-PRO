// @ts-nocheck
import { test, expect, Page } from '@playwright/test';

test.describe('Modal and Search Bar UX', () => {
  // Helper for sign-in
  async function signIn(page: Page) {
    await page.goto('/');
    await page.fill('input[type="email"]', 'testuser@gmail.com');
    await page.fill('input[type="password"]', 'testpassword123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('img[alt="Profile"], img[alt="User Avatar"], #mainProfileAvatar')).toBeVisible();
  }

  test('modal and search bar UX', async ({ page }) => {
    await signIn(page);
    // Profile modal
    await page.getByTestId('profile-btn').click();
    await expect(page.getByTestId('profile-modal')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('profile-modal')).toBeHidden();
    // Analytics modal
    await page.getByTestId('analytics-btn').click();
    await expect(page.getByTestId('analytics-modal')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('analytics-modal')).toBeHidden();
    // Smart learning modal
    await page.getByTestId('smart-learning-link').click();
    await expect(page.getByTestId('smart-learning-modal')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('smart-learning-modal')).toBeHidden();
    // Settings modal
    await page.getByTestId('settings-link').click();
    await expect(page.getByTestId('settings-modal')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('settings-modal')).toBeHidden();
    // Open two modals in a row, ensure only one is visible
    await page.getByTestId('profile-btn').click();
    await page.getByTestId('analytics-btn').click();
    await expect(page.getByTestId('profile-modal')).toBeHidden();
    await expect(page.getByTestId('analytics-modal')).toBeVisible();
  });

  test('Handles empty, special, and long queries', async ({ page }) => {
    await signIn(page);
    await page.fill('#questionSearchInput', '');
    await page.click('#questionSearchBtn');
    await expect(page.locator('#searchResults')).toContainText('No results');
    await page.fill('#questionSearchInput', '@#$%^&*()');
    await page.click('#questionSearchBtn');
    await expect(page.locator('#searchResults')).toContainText('No results');
    const longQuery = 'a'.repeat(500);
    await page.fill('#questionSearchInput', longQuery);
    await page.click('#questionSearchBtn');
    await expect(page.locator('#searchResults')).toContainText('No results');
  });
});