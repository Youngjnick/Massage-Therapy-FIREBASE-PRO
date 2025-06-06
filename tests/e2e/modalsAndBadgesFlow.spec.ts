// @ts-nocheck
import { test, expect } from '@playwright/test';
import { mockAuth } from './helpers/e2eDebugHelpers';

// Helper to set mock auth before each test
// async function mockAuth(page: Page) {
//   await page.addInitScript(() => {
//     window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
//       email: 'testuser@gmail.com',
//       name: 'Test User',
//       uid: 'mock-uid-123',
//     }));
//   });
// }

const TEST_EMAIL = process.env.TEST_EMAIL ?? '';
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? '';

test.describe('Modals and badge images', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
    await page.goto('/');
    // Wait for sign-in form
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"], button:has-text("Sign In")');
    // Wait for main UI (profile button or header)
    await page.waitForSelector('button[aria-label="Profile"], button:has-text("Profile"), header, nav');
    // Set up badge data after sign-in
    await page.evaluate(() => {
      localStorage.setItem("earnedBadges", JSON.stringify(["accuracy_100"]));
      localStorage.setItem("badgesData", JSON.stringify([
        { id: "accuracy_100", name: "100% Accuracy", image: "/badges/accuracy_100.png" }
      ]));
    });
    await page.reload();
    await page.waitForSelector('button[aria-label="Profile"], button:has-text("Profile"), header, nav');
  });

  test('Profile, Smart Learning, Analytics modals open/close', async ({ page }) => {
    // Profile
    await page.getByTestId('profile-btn').click();
    await expect(page.getByTestId('profile-modal')).toBeVisible();
    await page.getByTestId('close-profile-modal').click();
    await expect(page.getByTestId('profile-modal')).not.toBeVisible();
    // Smart Learning
    await page.getByTestId('smart-learning-link').click();
    await expect(page.getByTestId('smart-learning-modal')).toBeVisible();
    await page.getByTestId('close-smart-learning-modal').click();
    await expect(page.getByTestId('smart-learning-modal')).not.toBeVisible();
    // Analytics
    await page.getByTestId('analytics-btn').click();
    await expect(page.getByTestId('analytics-modal')).toBeVisible();
    await page.getByTestId('close-analytics-modal').click();
    await expect(page.getByTestId('analytics-modal')).not.toBeVisible();
  });

  test('Badge images load and fallback UI appears for missing images', async ({ page }) => {
    // Wait for badge images to load
    const badgeImgs = await page.locator('[data-testid^="badge-image-"]');
    await expect(badgeImgs.first()).toBeVisible();
    // Simulate missing image by removing src (cast to HTMLImageElement)
    await badgeImgs.first().evaluate(img => {
      if (img instanceof HTMLImageElement) img.src = '/badges/does-not-exist.png';
    });
    // Should fallback to hiding image (onError)
    await expect(badgeImgs.first()).not.toBeVisible();
  });
});
