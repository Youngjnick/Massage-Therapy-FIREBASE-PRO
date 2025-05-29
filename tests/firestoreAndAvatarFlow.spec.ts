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

test.describe('Firestore and Avatar Flow', () => {
  // Helper for sign-in
  async function signIn(page: Page) {
    await page.goto('/');
    await page.fill('input[type="email"]', 'testuser@gmail.com');
    await page.fill('input[type="password"]', 'testpassword123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('img[alt="Profile"], img[alt="User Avatar"], #mainProfileAvatar')).toBeVisible();
  }

  test('firestore and avatar flow', async ({ page }) => {
    await mockAuth(page); // Set mock authentication
    await signIn(page);
    // Simulate sign-in (update selector as needed for your app)
    await page.click('text=Sign In');
    // Wait for avatar to appear (update selector as needed)
    await expect(page.locator('#mainProfileAvatar')).toBeVisible();
    // Optionally check src attribute for Google or default avatar
    const src = await page.locator('#mainProfileAvatar').getAttribute('src');
    expect(src).toContain('avatar');
  });

  test('quiz loads questions from Firestore after sign-in', async ({ page }) => {
    await mockAuth(page); // Set mock authentication
    await signIn(page);
    // Simulate sign-in (update selector as needed for your app)
    await page.click('text=Sign In');
    // Wait for questions to load (update selector as needed)
    await page.waitForSelector('.quiz-card');
    // Check that at least one question is present
    const questionText = await page.locator('.question-text').textContent();
    if (questionText) {
      expect(questionText.length).toBeGreaterThan(0);
    } else {
      expect(questionText).not.toBeNull(); // Will fail and show a clear error if missing
    }
  });
});
