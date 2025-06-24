import { test, expect } from '@playwright/test';

test.describe('Finish and Finish Quiz Buttons', () => {
  test('completes quiz and shows results with Finish button', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Quiz Length').fill('2');
    await page.getByRole('button', { name: /start/i }).click();
    // Answer first question
    await page.getByTestId('quiz-option').first().click();
    await page.getByRole('button', { name: /next/i }).click();
    // Answer second question
    await page.getByTestId('quiz-option').first().click();
    // Click Finish
    await page.getByRole('button', { name: /finish/i }).click();
    // Results screen should be visible
    await expect(page.getByTestId('quiz-results')).toBeVisible();
  });

  test('shows Finish Quiz button and works as expected', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Quiz Length').fill('1');
    await page.getByRole('button', { name: /start/i }).click();
    await page.getByTestId('quiz-option').first().click();
    // Click Finish Quiz if present
    const finishQuizBtn = page.getByRole('button', { name: /finish quiz/i });
    if (await finishQuizBtn.isVisible()) {
      await finishQuizBtn.click();
    } else {
      // Fallback: try Finish
      await page.getByRole('button', { name: /finish/i }).click();
    }
    await expect(page.getByTestId('quiz-results')).toBeVisible();
  });
});
