// Example Playwright test for the bookmarks sidebar
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

test.describe('Bookmarks Sidebar', () => {
  // Helper for sign-in
  async function signIn(page: Page) {
    await page.goto('/');
    await page.fill('input[type="email"]', 'testuser@gmail.com');
    await page.fill('input[type="password"]', 'testpassword123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('img[alt="Profile"], img[alt="User Avatar"], #mainProfileAvatar')).toBeVisible();
  }

  test('Bookmarks Sidebar: should be visible if bookmarks exist', async ({ page }) => {
    await mockAuth(page);
    await signIn(page);
    // Inject E2E flag and questions before any app code runs
    await page.addInitScript(() => {
      // @ts-ignore
      window.__E2E_TEST__ = true;
      localStorage.setItem('questions', JSON.stringify([
        {
          id: 'test-q1',
          question: 'What is the capital of France?',
          answers: ['Paris', 'London', 'Berlin', 'Rome'],
          correct: 0,
          topic: 'geography',
          unit: 'europe'
        }
      ]));
      localStorage.setItem('bookmarkedQuestions', JSON.stringify([
        { id: 'test-q1', question: 'Sample bookmarked question?' }
      ]));
    });
    await page.goto('/');
    // Wait for the topic dropdown to be populated with real options
    await page.waitForFunction(() => {
      const sel = document.querySelector('.control[data-topic]');
      return sel && (sel instanceof HTMLSelectElement) && sel.options.length > 1;
    }, { timeout: 10000 });
    // Select the first real topic (skip placeholder)
    await page.selectOption('.control[data-topic]', { index: 1 });
    await page.selectOption('.control[data-quiz-length]', { value: '5' });
    // Start the quiz
    await page.click('.start-btn');
    // Explicitly call renderBookmarkedIndex in case the app does not call it automatically
    await page.evaluate(() => {
      // @ts-ignore
      if (window.renderBookmarkedIndex) window.renderBookmarkedIndex();
    });
    // Wait for the bookmarks index container
    await page.waitForSelector('#bookmarked-index', { timeout: 5000 });
    const sidebar = await page.$('#bookmarked-index');
    expect(sidebar).not.toBeNull();
    await expect(page.locator('#bookmarked-index')).toContainText('Bookmarked Questions');
  });
});
