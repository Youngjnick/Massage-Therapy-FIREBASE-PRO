import { test, expect } from '@playwright/test';

test.describe('Keyboard-Only Navigation and Quiz Restart', () => {
  test('Complete a quiz using direct element selection/clicks', async ({ page }) => {
    await page.goto('/');
    await page.goto('/quiz'); // Ensure we are on the quiz start form
    await page.getByLabel('Quiz Length').fill('2');
    await page.getByRole('button', { name: /start/i }).click();
    // First question: select first option and go next
    await page.getByTestId('quiz-option').first().click();
    await page.getByRole('button', { name: /next/i }).click();
    // Second question: select first option and finish
    await page.getByTestId('quiz-option').first().click();
    await page.getByRole('button', { name: /finish/i }).click();
    // Results screen should be visible
    await expect(page.getByTestId('quiz-results')).toBeVisible();
    // Accessibility: Tab to "Start New Quiz" and activate with keyboard
    await page.getByTestId('start-new-quiz-btn').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Quiz Length')).toBeVisible();
  });

  test('Quiz restart resets all state and focus', async ({ page }) => {
    await page.goto('/');
    await page.goto('/quiz'); // Ensure we are on the quiz start form
    await page.getByLabel('Quiz Length').fill('1');
    await page.getByRole('button', { name: /start/i }).click();
    await page.getByTestId('quiz-option').first().click();
    await page.getByRole('button', { name: /finish/i }).click();
    await expect(page.getByTestId('quiz-results')).toBeVisible();
    // Click restart button ("Start New Quiz") using test ID
    await page.getByTestId('start-new-quiz-btn').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Quiz Length')).toBeVisible();
    // Focus should be on Quiz Length input
    const active = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
    expect(active?.toLowerCase()).toContain('quiz length');
    // Start a new quiz to ensure state is reset
    await page.getByLabel('Quiz Length').fill('1');
    await page.getByRole('button', { name: /start/i }).click();
    await expect(page.getByTestId('quiz-question-card')).toBeVisible();
  });
});
