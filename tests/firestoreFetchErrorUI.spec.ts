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

test.describe('Firestore Fetch Error UI', () => {
  // Helper for sign-in
  async function signIn(page: Page) {
    await page.goto('/');
    await page.fill('input[type="email"]', 'testuser@gmail.com');
    await page.fill('input[type="password"]', 'testpassword123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('img[alt="Profile"], img[alt="User Avatar"], #mainProfileAvatar')).toBeVisible();
  }

  test('Shows error UI if Firestore fetch fails', async ({ page }) => {
    await mockAuth(page);
    await signIn(page);
    // Simulate fetchQuestions throwing an error
    await page.evaluate(() => {
      window.fetchQuestions = async () => { throw new Error('Simulated Firestore error'); };
    });
    await page.reload();
    // Look for the error message in the UI
    await expect(page.locator('body')).toContainText(/failed to load questions/i);
  });
});