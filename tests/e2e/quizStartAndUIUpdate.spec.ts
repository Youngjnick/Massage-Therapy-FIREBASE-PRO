// @ts-nocheck
import { test, expect } from '@playwright/test';
import { mockAuth } from './helpers/e2eDebugHelpers';

test('Quiz UI updates after questions are loaded and quiz is started', async ({ page }) => {
  await mockAuth(page);
  await page.goto('/');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await page.evaluate(() => (window as any).waitForE2EReactReady && (window as any).waitForE2EReactReady());
  // Wait for questions to load
  await page.waitForSelector('.question, .quiz-question, .question-list-item', { timeout: 5000 });
  // Start the quiz (simulate user action)
  if (await page.locator('.start-quiz-btn').count() > 0) {
    await page.click('.start-quiz-btn');
  } else if (await page.locator('button:has-text("Start Quiz")').count() > 0) {
    await page.click('button:has-text("Start Quiz")');
  }
  // Check that the quiz UI is visible
  await expect(page.locator('.quiz-ui, .quiz-question')).toBeVisible();
});