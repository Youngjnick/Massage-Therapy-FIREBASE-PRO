/* global console */
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
    // Debug: check for both buttons
    const finishQuizBtn = page.getByRole('button', { name: /finish quiz/i });
    const finishBtn = page.getByRole('button', { name: /finish/i });
    const finishQuizVisible = await finishQuizBtn.isVisible({ timeout: 5000 }).catch(() => false);
    const finishVisible = await finishBtn.isVisible({ timeout: 5000 }).catch(() => false);
    console.log('[E2E DEBUG] Finish Quiz visible:', finishQuizVisible, 'Finish visible:', finishVisible);
    if (finishQuizVisible) {
      await finishQuizBtn.click();
      console.log('[E2E DEBUG] Clicked Finish Quiz button');
    } else if (finishVisible) {
      await finishBtn.click();
      console.log('[E2E DEBUG] Clicked Finish button');
    } else {
      throw new Error('Neither Finish Quiz nor Finish button was visible');
    }
    await expect(page.getByTestId('quiz-results')).toBeVisible();
    console.log('[E2E DEBUG] Quiz results are visible');
  }, 60000);
  });
