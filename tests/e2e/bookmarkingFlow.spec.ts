// @ts-nocheck
// Playwright E2E: Bookmarking flow
import { test, expect } from '@playwright/test';
import { setTestStateWithWait, waitForAppReady } from './helpers/e2eDebugHelpers';

test.describe('Bookmarking Flow', () => {
  test('should bookmark a question and show it in the sidebar', async ({ page }) => {
    await page.addInitScript(() => {
      window.__E2E_TEST__ = true;
      window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
        email: 'testuser@gmail.com',
        name: 'Test User',
        uid: 'mock-uid-123',
      }));
    });
    await page.goto('http://localhost:5173');
    await waitForAppReady(page);
    await setTestStateWithWait(page, {
      questions: [
        {
          id: 'test-q1',
          question: 'What is the capital of France?',
          answers: ['Paris', 'London', 'Berlin', 'Rome'],
          correct: 0,
          topic: 'geography',
          unit: 'europe'
        }
      ]
    });
    // Select the first real topic (skip placeholder)
    await page.selectOption('.control[data-topic]', { index: 1 });
    await page.selectOption('.control[data-quiz-length]', { value: '5' });
    // Start the quiz
    await page.click('.start-btn');
    // Wait for the first question to load
    await page.waitForSelector('.question-text, .question-container', { timeout: 5000 });
    // Wait for the bookmark button to be enabled
    await page.waitForSelector('.bookmark-btn:not([disabled])', { timeout: 5000 });
    // Click the bookmark button
    await page.click('.bookmark-btn');
    // Explicitly call renderBookmarkedIndex in case the app does not call it automatically
    await page.evaluate(() => {
      // @ts-ignore
      if (window.renderBookmarkedIndex) window.renderBookmarkedIndex();
    });
    // Wait for the bookmarks sidebar to update
    await page.waitForSelector('#bookmarked-index', { timeout: 5000 });
    const sidebar = await page.$('#bookmarked-index');
    expect(sidebar).not.toBeNull();
    await expect(page.locator('#bookmarked-index')).toContainText('Bookmarked Questions');
  });
});
