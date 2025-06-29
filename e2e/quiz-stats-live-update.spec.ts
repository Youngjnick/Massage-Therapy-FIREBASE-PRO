import { test, expect } from '@playwright/test';
import { uiSignIn } from './helpers/uiSignIn';

test.describe('Quiz Stats Live Update', () => {
  test('Stats and topic stats update after quiz completion', async ({ page }) => {
    test.setTimeout(60000);
    try {
      await uiSignIn(page);
      await page.goto('/analytics');
      await page.waitForSelector('h1');
      const initialQuizzesTaken = await page.locator('text=Quizzes Taken:').textContent();
      const initialCorrect = await page.locator('text=Correct Answers:').textContent();
      const initialAccuracy = await page.locator('text=Accuracy:').textContent();
      const initialTopicStats = await page.locator('[data-testid="quiz-topic-progress"]').innerText().catch(() => '');
      await page.waitForTimeout(1000);
      await page.goto('/quiz');
      await page.waitForSelector('[data-testid="quiz-start-form"]', { timeout: 10000 });
      await page.getByLabel('Quiz Length').fill('2');
      await page.getByRole('button', { name: /start/i }).click();
      await page.waitForSelector('[data-testid="quiz-question-card"]', { timeout: 10000 });
      const options = page.getByTestId('quiz-option');
      for (let i = 0; i < 2; i++) {
        await options.first().click();
        await page.getByRole('button', { name: /next|finish/i }).click();
      }
      await expect(page.getByTestId('quiz-results')).toBeVisible();
      await page.goto('/analytics');
      await page.waitForTimeout(2000);
      const updatedQuizzesTaken = await page.locator('text=Quizzes Taken:').textContent();
      const updatedCorrect = await page.locator('text=Correct Answers:').textContent();
      const updatedAccuracy = await page.locator('text=Accuracy:').textContent();
      const updatedTopicStats = await page.locator('[data-testid="quiz-topic-progress"]').innerText().catch(() => '');
      expect(updatedQuizzesTaken).not.toBe(initialQuizzesTaken);
      expect(updatedCorrect).not.toBe(initialCorrect);
      expect(updatedAccuracy).not.toBe(initialAccuracy);
      expect(updatedTopicStats).not.toBe(initialTopicStats);
    } catch (err) {
      // Print error for debugging
      // eslint-disable-next-line no-undef
      console.error('Test failed:', err);
      throw err;
    }
  });
});
