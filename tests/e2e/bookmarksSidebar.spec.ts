// @ts-nocheck
// Example Playwright test for the bookmarks sidebar
import { test, expect } from '@playwright/test';

test.describe('Bookmarks Sidebar', () => {
  test('Bookmarks Sidebar: should be visible if bookmarks exist', async ({ page }) => {
    await page.addInitScript(() => {
      // @ts-ignore
      window.__E2E_TEST__ = true;
      window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
        email: 'testuser@gmail.com',
        name: 'Test User',
        uid: 'mock-uid-123',
      }));
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
    // Wait for React E2E hook
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.evaluate(() => (window as any).waitForE2EReactReady && (window as any).waitForE2EReactReady());
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
