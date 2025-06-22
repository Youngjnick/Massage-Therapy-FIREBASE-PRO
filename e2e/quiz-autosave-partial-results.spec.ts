import { test, expect } from '@playwright/test';

// Test: Quiz auto-save and resume (Firestore/localStorage)
test.describe('Quiz Auto-Save and Resume', () => {
  test('Auto-saves progress for guest (localStorage) and resumes on reload', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Quiz Length').fill('2');
    await page.getByRole('button', { name: /start/i }).click();
    // Answer first question
    await page.getByTestId('quiz-option').first().click();
    // Reload page
    await page.reload();
    // Should see resume prompt
    await expect(page.getByText(/resume your quiz/i)).toBeVisible();
    await page.getByRole('button', { name: /resume/i }).click();
    // Wait for quiz-question-card to be visible after resuming
    await expect(page.getByTestId('quiz-question-card')).toBeVisible();
    // Should restore progress (first question answered)
    // Use isChecked() on quiz-radio
    const isChecked = await page.getByTestId('quiz-radio').first().isChecked();
    expect(isChecked).toBeTruthy();
  });

  test('Shows cancel/exit confirmation dialog when leaving quiz', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Quiz Length').fill('2');
    await page.getByRole('button', { name: /start/i }).click();
    // Try to navigate away
    await page.goBack();
    // Should see confirmation dialog
    await expect(page.getByText(/are you sure.*exit/i)).toBeVisible();
    // Cancel exit
    await page.getByRole('button', { name: /stay/i }).click();
    await expect(page.getByTestId('quiz-question-card')).toBeVisible();
  });
});

// Test: Partial results display for early finish
test.describe('Quiz Partial Results', () => {
  test('Shows partial results and highlights unanswered questions', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Quiz Length').fill('3');
    await page.getByRole('button', { name: /start/i }).click();
    // Answer only first question
    await page.getByTestId('quiz-option').first().click();
    // Skip to last question and finish
    await page.getByTestId('quiz-step').nth(2).click();
    await page.getByRole('button', { name: /finish/i }).click();
    // Results screen should show partial/summary
    await expect(page.getByTestId('quiz-results')).toBeVisible();
    await expect(page.getByText(/answered 1 of 3/i)).toBeVisible();
    // Unanswered/skipped questions should be highlighted
    await expect(page.getByTestId('quiz-step').nth(1)).toHaveClass(/skipped|unanswered/);
  });
});
