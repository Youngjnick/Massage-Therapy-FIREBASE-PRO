import { test, expect } from '@playwright/test';
import { uiSignIn } from './helpers/uiSignIn';
import { getTestUser } from './helpers/getTestUser';
import './helpers/playwright-coverage';

let testUser: { email: string; password: string; uid?: string };
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

test.describe('Keyboard-Only Navigation and Quiz Restart', () => {
  test('Complete a quiz using direct element selection/clicks', async ({ page }) => {
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
    // Click Finish (early) button
    await finishBtnEarly.click();
    // Should see quiz results
    await expect(page.getByTestId('quiz-results')).toBeVisible();
    // Start another quiz for normal finish
    await page.getByRole('button', { name: /start new quiz/i }).click();
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
    await finishBtn.click();
    await expect(page.getByTestId('quiz-results')).toBeVisible();
  });

  test('Quiz restart resets all state and focus', async ({ page }) => {
    // Test user sign-in and navigation to /quiz is handled in hooks
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
