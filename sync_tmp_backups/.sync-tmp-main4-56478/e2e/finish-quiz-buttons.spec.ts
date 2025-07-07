// @ts-nocheck
/* global console */
// @ts-expect-error: Playwright provides types for test context
import { test, expect } from '@playwright/test';
import { uiSignIn } from './helpers/uiSignIn';
import { getTestUser } from './helpers/getTestUser';
import { getUserStats } from './helpers/getUserStats';

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
    // Select the first real topic (not empty/Other) from the topic select, matching the UI logic (first element in sorted topics array)
    const topicSelect = page.locator('#quiz-topic-select, [data-testid="quiz-topic-select"]');
    let firstValid = null;
    let firstLabel = null;
    // Select a specific real topic for topic breakdowns
    const TARGET_TOPIC_LABEL = 'Abdominal Muscle Origins';
    const TARGET_TOPIC_VALUE = 'abdominal_muscle_origins';
    let selected = false;
    if (await topicSelect.count() > 0) {
      const options = await topicSelect.locator('option').all();
      // Try to select by value first
      for (const opt of options) {
        const val = await opt.getAttribute('value');
        if (val === TARGET_TOPIC_VALUE) {
          await topicSelect.selectOption(val);
          console.log('[E2E DEBUG] Selected topic value (by value):', val);
          selected = true;
          break;
        }
      }
      // If not found by value, try by label
      if (!selected) {
        for (const opt of options) {
          const label = (await opt.textContent())?.trim();
          if (label === TARGET_TOPIC_LABEL) {
            const val = await opt.getAttribute('value');
            if (val) {
              await topicSelect.selectOption(val);
              console.log('[E2E DEBUG] Selected topic value (by label):', val);
              selected = true;
              break;
            }
          }
        }
      }
      // Fallback: select first valid topic (not empty/Other)
      if (!selected) {
        for (const opt of options) {
          const val = await opt.getAttribute('value');
          if (val && val !== '' && val.toLowerCase() !== 'other') {
            await topicSelect.selectOption(val);
            console.log('[E2E DEBUG] Selected topic value (fallback):', val);
            break;
          }
        }
      }
    }
    if (firstValid) {
      // Wait for quiz length input's max to update (UI must reflect topic change)
      const prevMax = await quizLengthInput.getAttribute('max');
      await page.waitForFunction(
        (input, oldMax) => input && input.max !== oldMax && input.max !== '0',
        quizLengthInput,
        prevMax
      );
      const max = await quizLengthInput.getAttribute('max');
      if (!max || Number(max) < 1) throw new Error('Selected topic has no questions!');
    }
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

    // --- Quiz stats debug output ---
    const quizStatsDebug = await page.evaluate(() => (window as any).__QUIZ_STATS_DEBUG__);
    console.log('[E2E DEBUG] window.__QUIZ_STATS_DEBUG__:', quizStatsDebug);

    // --- Firestore stat check ---
    // Get user UID from localStorage
    const userUid = await page.evaluate(() => window.localStorage.getItem('firebaseUserUid'));
    expect(userUid).toBeTruthy();
    // Poll Firestore for analytics.completed increment, with granular debug output
    let analytics = null;
    let lastErr = null;
    const statsDocPath = `users/${userUid}/stats/analytics`;
    for (let i = 0; i < 20; i++) {
      try {
        analytics = await getUserStats(userUid);
        console.log(`[E2E DEBUG] [Poll ${i+1}] Firestore stats at ${statsDocPath}:`, analytics);
        if (analytics && typeof analytics.completed === 'number' && analytics.completed > 0) break;
      } catch (err) {
        lastErr = err;
        console.log(`[E2E DEBUG] [Poll ${i+1}] Error fetching stats:`, err);
      }
      await page.waitForTimeout(1000);
    }
    if (!(analytics && analytics.completed > 0)) {
      console.log('[E2E ERROR] Final analytics value:', analytics, 'Last error:', lastErr);
      throw new Error('Firestore analytics.completed did not increment after quiz finish!');
    }
    console.log('[E2E DEBUG] Firestore analytics after finish:', analytics);
  });

  test('shows Finish Quiz button and works as expected', async ({ page }) => {
    // Wait for Quiz Length input
    const quizLengthInput = await page.waitForSelector('input[aria-label="Quiz Length"]:not([disabled])', { timeout: 10000 });
    // Select the first real topic (not empty/Other) from the topic select, matching the UI logic (first element in sorted topics array)
    const topicSelect = page.locator('#quiz-topic-select, [data-testid="quiz-topic-select"]');
    if (await topicSelect.count() > 0) {
      const options = await topicSelect.locator('option').all();
      // Find the last valid topic (not empty/Other)
      let lastValid = null;
      for (const opt of options) {
        const val = await opt.getAttribute('value');
        if (val && val !== '' && val.toLowerCase() !== 'other') {
          lastValid = val;
        }
      }
      if (lastValid) {
        await topicSelect.selectOption(lastValid);
        console.log('[E2E DEBUG] Selected last topic value:', lastValid);
      }
    }
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
    // --- Firestore stat check ---
    const userUid = await page.evaluate(() => window.localStorage.getItem('firebaseUserUid'));
    expect(userUid).toBeTruthy();
    let analytics = null;
    for (let i = 0; i < 10; i++) {
      analytics = await getUserStats(userUid);
      if (analytics && typeof analytics.completed === 'number' && analytics.completed > 0) break;
      await page.waitForTimeout(1000);
    }
    expect(analytics && analytics.completed > 0).toBeTruthy();
    console.log('[E2E DEBUG] Firestore analytics after finish:', analytics);
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
    // --- Firestore stat check ---
    const userUid2 = await page.evaluate(() => window.localStorage.getItem('firebaseUserUid'));
    expect(userUid2).toBeTruthy();
    let analytics2 = null;
    for (let i = 0; i < 10; i++) {
      analytics2 = await getUserStats(userUid2);
      if (analytics2 && typeof analytics2.completed === 'number' && analytics2.completed > 0) break;
      await page.waitForTimeout(1000);
    }
    expect(analytics2 && analytics2.completed > 0).toBeTruthy();
    console.log('[E2E DEBUG] Firestore analytics after finish:', analytics2);
  });
});
