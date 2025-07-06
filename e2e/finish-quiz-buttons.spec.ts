// @ts-nocheck
/* global console */
// @ts-expect-error: Playwright provides types for test context
import { test, expect } from '@playwright/test';
import { uiSignIn } from './helpers/uiSignIn';
import { getTestUser } from './helpers/getTestUser';

let testUser;
test.beforeAll(async () => {
  testUser = await getTestUser(0);
});

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.context().clearCookies();
  await page.reload();
  await uiSignIn(page, { email: testUser.email, password: testUser.password, profilePath: '/profile' });
  await page.goto('/quiz');
});

test.describe('Finish and Finish Quiz Buttons', () => {
  test('completes quiz and shows results with Finish button', async ({ page }) => {
    // Wait for Quiz Length input
    const quizLengthInput = await page.waitForSelector('input[aria-label="Quiz Length"]:not([disabled])', { timeout: 10000 });
    await quizLengthInput.fill('2');
    console.log('[E2E PROGRESS] Filled Quiz Length input');
    await page.getByRole('button', { name: /start/i }).click();
    console.log('[E2E PROGRESS] Clicked Start button');
    // Dump page HTML after clicking Start for debugging
    const pageHtml = await page.content();
    console.log('[E2E DEBUG] Page HTML after Start:', pageHtml);
    // Debug: count number of quiz stepper dots rendered
    const stepDots = await page.locator('[data-testid="quiz-stepper-dot"]').count();
    console.log(`[E2E DEBUG] Number of quiz stepper dots: ${stepDots}`);
    if (stepDots !== 2) {
      throw new Error(`Expected 2 quiz stepper dots, but found ${stepDots}`);
    }
    // Answer first question
    const firstOption = page.getByTestId('quiz-option').first();
    await expect(firstOption).toBeVisible();
    await firstOption.click();
    await page.waitForTimeout(150); // allow UI to update
    console.log('[E2E PROGRESS] Selected first quiz option');
    // Wait for Next button to be enabled, then click
    const nextBtn = page.getByRole('button', { name: /next/i });
    await expect(nextBtn).toBeEnabled({ timeout: 10000 });
    await nextBtn.click();
    console.log('[E2E PROGRESS] Clicked Next button');
    // Answer second question
    const secondOption = page.getByTestId('quiz-option').first();
    await expect(secondOption).toBeVisible();
    await secondOption.click();
    await page.waitForTimeout(150);
    console.log('[E2E PROGRESS] Selected second quiz option');
    // Robustly handle both auto-submit and explicit finish flows
    const finishBtn = page.locator('button[aria-label="Finish quiz"]');
    // Wait for either the results screen or the Finish Quiz button
    const resultsPromise = page.waitForSelector('[data-testid="quiz-results"]', { timeout: 10000 }).catch(() => null);
    const finishBtnPromise = finishBtn.isVisible().then(async (visible) => {
      if (visible) {
        await expect(finishBtn).toBeEnabled({ timeout: 10000 });
        await finishBtn.click();
        return true;
      }
      return false;
    }).catch(() => false);
    // Wait for either to resolve
    const [results, finishClicked] = await Promise.all([resultsPromise, finishBtnPromise]);
    if (!results && !finishClicked) {
      throw new Error('Neither results screen nor Finish Quiz button appeared');
    }
    // Results screen should be visible
    await expect(page.getByTestId('quiz-results')).toBeVisible();
    console.log('[E2E PROGRESS] Quiz results are visible');
  });

  test('shows Finish Quiz button and works as expected', async ({ page }) => {
    // Wait for Quiz Length input
    const quizLengthInput = await page.waitForSelector('input[aria-label="Quiz Length"]:not([disabled])', { timeout: 10000 });
    await quizLengthInput.fill('2');
    await page.getByRole('button', { name: /start/i }).click();
    // Answer first question
    const firstOption = page.getByTestId('quiz-option').first();
    await expect(firstOption).toBeVisible();
    await firstOption.click();
    await page.waitForTimeout(150);
    // Should see Finish (early) button
    const finishBtnEarly = page.locator('button[aria-label="Finish quiz early"]');
    await expect(finishBtnEarly).toBeEnabled({ timeout: 10000 });
    await finishBtnEarly.click();
    // Should see quiz results
    await expect(page.getByTestId('quiz-results')).toBeVisible();
    // Start another quiz for normal finish
    await page.getByRole('button', { name: /start new quiz/i }).click();
    // Re-query the quiz length input after DOM update
    const quizLengthInput2 = await page.waitForSelector('input[aria-label="Quiz Length"]:not([disabled])', { timeout: 10000 });
    await quizLengthInput2.fill('2');
    await page.getByRole('button', { name: /start/i }).click();
    // Answer all questions
    const option1 = page.getByTestId('quiz-option').first();
    await expect(option1).toBeVisible();
    await option1.click();
    await page.waitForTimeout(150);
    const nextBtn = page.getByRole('button', { name: /next/i });
    await expect(nextBtn).toBeEnabled({ timeout: 10000 });
    await nextBtn.click();
    const option2 = page.getByTestId('quiz-option').first();
    await expect(option2).toBeVisible();
    await option2.click();
    await page.waitForTimeout(150);
    // Should see Finish Quiz button
    const finishBtn = page.locator('button[aria-label="Finish quiz"]');
    await expect(finishBtn).toBeEnabled({ timeout: 10000 });
    // Assert that the quiz is now on the last question (question 2 of 2)
    // If your UI shows a question number, check it here. Otherwise, check for the Finish Quiz button.
    await finishBtn.waitFor({ state: 'visible', timeout: 10000 });
    await expect(finishBtn).toBeEnabled({ timeout: 10000 });
    console.log('[E2E PROGRESS] Finish Quiz button is visible and enabled');
    await finishBtn.click();
    console.log('[E2E PROGRESS] Clicked Finish Quiz button');
    // Results screen should be visible
    await expect(page.getByTestId('quiz-results')).toBeVisible();
  });
});
