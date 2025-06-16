/* eslint-env browser */
import { test, expect } from '@playwright/test';

// Only run the failing test for now
test('should focus first option after starting quiz', async ({ page }) => {
  await page.goto('/');
  await page.screenshot({ path: 'screenshots/step1-home.png', fullPage: true });
  await page.getByLabel('Quiz Length').fill('1');
  await page.screenshot({ path: 'screenshots/step2-filled-quiz-length.png', fullPage: true });
  await page.getByLabel(/topic/i).selectOption({ index: 0 });
  await page.screenshot({ path: 'screenshots/step3-selected-topic.png', fullPage: true });
  await page.getByRole('button', { name: /start/i }).click();
  await page.screenshot({ path: 'screenshots/step4-after-start.png', fullPage: true });
  const firstOption = page.getByTestId('quiz-option').first();
  const input = await firstOption.getByTestId('quiz-radio');
  await expect(input).toBeFocused();
});

test.skip('should allow keyboard navigation through options and buttons', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('2');
  await page.getByRole('button', { name: /start/i }).click();
  // Wait for the first radio input to be visible
  const firstRadio = page.getByTestId('quiz-option').first().locator('input[type="radio"]');
  await expect(firstRadio).toBeVisible();
  // Click the first radio and check it is selected
  await firstRadio.click();
  await expect(firstRadio).toBeChecked();
  // Use ArrowDown to move to the second radio and check it is selected
  await firstRadio.focus();
  await page.keyboard.press('ArrowDown');
  const secondRadio = page.getByTestId('quiz-option').nth(1).locator('input[type="radio"]');
  // Wait for React state to update
  await page.waitForTimeout(150);
  await expect(secondRadio).toBeChecked();
  // Tab to navigation buttons (Prev/Next/Finish)
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  // Should be on Prev button
  await expect(page.getByRole('button', { name: /prev/i })).toBeFocused();
});

test('should reset quiz and focus first option after restart', async ({ page }) => {
  await page.goto('/');
  await page.screenshot({ path: 'screenshots/reset-1-home.png', fullPage: true });
  await page.getByLabel('Quiz Length').fill('1');
  await page.getByRole('button', { name: /start/i }).click();
  await page.screenshot({ path: 'screenshots/reset-2-quiz-started.png', fullPage: true });
  await page.getByTestId('quiz-option').first().click();
  await page.getByRole('button', { name: /finish/i }).click();
  await page.screenshot({ path: 'screenshots/reset-3-finished.png', fullPage: true });
  await page.getByRole('button', { name: /start new quiz/i }).click();
  await page.screenshot({ path: 'screenshots/reset-4-new-quiz.png', fullPage: true });
  const input = await page.getByTestId('quiz-option').first().locator('input[type="radio"]');
  await expect(input).toBeFocused();
});

test('should handle edge case: no questions', async ({ page }) => {
  // Simulate no questions by intercepting API or clearing questions in test env
  // For now, just check for loading/error UI
  await page.goto('/');
  // If no questions, should show error or empty state
  // This is a placeholder, update as needed for your app's behavior
  // await expect(page.getByText(/no questions/i)).toBeVisible();
});

test('should handle edge case: rapid answer selection', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('2');
  await page.getByRole('button', { name: /start/i }).click();
  await page.screenshot({ path: 'screenshots/rapid-1-quiz-started.png', fullPage: true });
  const options = page.getByTestId('quiz-option');
  await options.nth(0).click();
  await options.nth(1).click();
  await options.nth(0).click();
  await page.screenshot({ path: 'screenshots/rapid-2-after-answers.png', fullPage: true });
  await expect(page.getByTestId('quiz-feedback')).toBeVisible();
});

test('should show explanations when enabled', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('1');
  await page.getByRole('button', { name: /start/i }).click();
  // Simulate enabling explanations (if toggle exists)
  // For now, check for explanation text if present
  // await expect(page.getByText(/explanation/i)).toBeVisible();
});

test('should show topic stats in results', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('1');
  await page.getByRole('button', { name: /start/i }).click();
  await page.getByTestId('quiz-option').first().click();
  await page.getByRole('button', { name: /finish/i }).click();
  await expect(page.getByText(/topic stats/i)).toBeVisible();
});

test('should render and be usable on mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 }); // iPhone 8 size
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('1');
  await page.getByRole('button', { name: /start/i }).click();
  await page.screenshot({ path: 'screenshots/mobile-quiz.png', fullPage: true });
  await expect(page.getByTestId('quiz-question-card')).toBeVisible();
  await expect(page.getByTestId('quiz-option').first()).toBeVisible();
});

test('should allow selecting options and navigation with keyboard and mouse', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('2');
  await page.getByRole('button', { name: /start/i }).click();
  // Wait for the first radio input to be visible
  const firstRadio = page.getByTestId('quiz-option').first().locator('input[type="radio"]');
  await expect(firstRadio).toBeVisible();
  // Click the first radio and check it is selected
  await firstRadio.click();
  await expect(firstRadio).toBeChecked();
  // Use ArrowDown to move to the second radio and check it is selected
  await firstRadio.focus();
  await page.keyboard.press('ArrowDown');
  const secondRadio = page.getByTestId('quiz-option').nth(1).locator('input[type="radio"]');
  // Wait for React state to update
  await page.waitForTimeout(150);
  await expect(secondRadio).toBeChecked();
  // Tab to navigation buttons (Prev/Next/Finish)
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  // Should be on Prev button
  await expect(page.getByRole('button', { name: /prev/i })).toBeFocused();
});
