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

test.describe('Firestore Question Loading UI', () => {
  // Helper for sign-in
  async function signIn(page: Page) {
    await page.goto('/');
    await page.fill('input[type="email"]', 'testuser@gmail.com');
    await page.fill('input[type="password"]', 'testpassword123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('img[alt="Profile"], img[alt="User Avatar"], #mainProfileAvatar')).toBeVisible();
  }

  test('firestore question loading UI', async ({ page }) => {
    await mockAuth(page); // Set up mock authentication
    await signIn(page);
    await page.goto('/');
    // Wait for questions to load (adjust selector as needed)
    await page.waitForSelector('.question, .quiz-question, .question-list-item', { timeout: 5000 });
    // Check that at least one question is displayed
    const questionCount = await page.locator('.question, .quiz-question, .question-list-item').count();
    expect(questionCount).toBeGreaterThan(0);
    // Optionally, check that the question text is not empty
    const questionText = await page.locator('.question, .quiz-question, .question-list-item').first().textContent();
    expect(questionText?.trim().length).toBeGreaterThan(0);
  });
});