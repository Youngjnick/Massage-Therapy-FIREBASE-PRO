// @ts-nocheck
import { test, expect, Page } from '@playwright/test';

// Helper to set mock auth before each test
async function mockAuth(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
      email: 'testuser@gmail.com',
      name: 'Test User',
      uid: 'mock-uid-123',
    }));
  });
}

test('mocks Google sign-in using E2E test hook', async ({ page }) => {
  // Set the localStorage key before page load to trigger mock auth
  await mockAuth(page);
  await page.goto('/');

  // The app should now treat us as signed in (mock user)
  // Wait for a selector that only appears when signed in
  await expect(page.locator('img[alt="Profile"], img[alt="User Avatar"], #mainProfileAvatar')).toBeVisible();

  // Optionally, check for the mock user's display name
  await expect(page.locator('text=E2E Test User')).toBeVisible();

  // ...continue with your test steps as an authenticated user
});
