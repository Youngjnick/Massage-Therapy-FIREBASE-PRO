import { test, expect } from '@playwright/test';

test('Quiz UI updates after questions are loaded and quiz is started', async ({ page }) => {
  await page.goto('/');
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