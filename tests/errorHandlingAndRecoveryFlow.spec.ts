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

test.describe('Error Handling & Recovery', () => {
  // Helper for sign-in
  async function signIn(page: Page) {
    await page.goto('/');
    await page.fill('input[type="email"]', 'testuser@gmail.com');
    await page.fill('input[type="password"]', 'testpassword123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('img[alt="Profile"], img[alt="User Avatar"], #mainProfileAvatar')).toBeVisible();
  }

  test('Simulate Firestore/network error and show error UI', async ({ page }) => {
    await mockAuth(page);
    await signIn(page);
    await page.evaluate(() => {
      window.fetchQuestions = async () => { throw new Error('Simulated Firestore error'); };
    });
    await page.reload();
    await expect(page.locator('body')).toContainText('Failed to load questions');
  });
  test('Simulate localStorage quota exceeded/corruption', async ({ page }) => {
    await mockAuth(page);
    await signIn(page);
    await page.evaluate(() => {
      // Simulate quota exceeded
      Storage.prototype.setItem = () => { throw new DOMException('QuotaExceededError', 'QuotaExceededError'); };
      try { localStorage.setItem('quizResults', '[]'); } catch (e) { window.localStorageError = true; }
    });
    await expect(page.evaluate(() => window.localStorageError)).resolves.toBe(true);
    // Simulate corruption
    await page.evaluate(() => { localStorage.setItem('quizResults', 'not-json'); });
    await page.reload();
    await expect(page.locator('body')).not.toContainText('crash');
  });
});