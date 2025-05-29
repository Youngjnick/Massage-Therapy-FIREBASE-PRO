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

// This test assumes a user is signed in and the app is loaded at the main page
// It simulates a sync (and error) and checks for the toast at the top of the page

// Fix for custom window property in Playwright test
declare global {
  interface Window {
    __FORCE_BOOKMARK_SYNC_ERROR__?: boolean;
  }
}

test.describe('Bookmark Sync Toast', () => {
  // Helper for sign-in
  async function signIn(page: Page) {
    await page.goto('/');
    await page.fill('input[type="email"]', 'testuser@gmail.com');
    await page.fill('input[type="password"]', 'testpassword123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('img[alt="Profile"], img[alt="User Avatar"], #mainProfileAvatar')).toBeVisible();
  }

  test('shows sync status toast when syncing bookmarks', async ({ page }) => {
    await mockAuth(page);
    await signIn(page);
    // Simulate a bookmark action to trigger sync
    await page.locator('.bookmark-btn').first().click();
    // The sync toast should appear at the top
    const toast = page.locator('.bookmark-sync-status');
    await expect(toast).toBeVisible();
    await expect(toast).toHaveText(/syncing bookmarks/i);
    // Wait for it to disappear (sync complete)
    await toast.waitFor({ state: 'detached', timeout: 5000 });
  });

  test('shows error toast if sync fails', async ({ page }) => {
    await mockAuth(page);
    await signIn(page);
    // Simulate a sync error by mocking fetch or Firestore (assumes test env allows this)
    await page.evaluate(() => {
      window.__FORCE_BOOKMARK_SYNC_ERROR__ = true;
    });
    await page.locator('.bookmark-btn').first().click();
    const errorToast = page.locator('.bookmark-sync-error');
    await expect(errorToast).toBeVisible();
    await expect(errorToast).toHaveText(/bookmark sync error/i);
  });
});
