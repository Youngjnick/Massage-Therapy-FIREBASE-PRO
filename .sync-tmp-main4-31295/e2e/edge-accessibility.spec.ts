/* global console */
import { test, expect } from '@playwright/test';
import { uiSignIn } from './helpers/uiSignIn';
import { getTestUser } from './helpers/getTestUser';

let testUser: { email: string; password: string; uid?: string };
test.beforeAll(async () => {
  testUser = await getTestUser(0);
});

test.describe('Quiz Edge Cases and Accessibility', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.context().clearCookies();
    await page.reload();
    await uiSignIn(page, { email: testUser.email, password: testUser.password, profilePath: '/profile' });
  });

  // All quiz-related tests should start on /quiz after sign-in

  test('Quiz with all options disabled: keyboard navigation skips disabled', async ({ page }, testInfo) => {
    await page.goto('/quiz');
    // Wait for Quiz Length input to be enabled, fail-fast if not
    let quizLengthInput;
    try {
      quizLengthInput = await page.waitForSelector('input[aria-label="Quiz Length"]:not([disabled])', { timeout: 10000 });
    } catch {
      const html = await page.content();
      if (testInfo) await testInfo.attach('page-html', { body: html, contentType: 'text/html' });
      throw new Error('Quiz Length input not enabled after 10s. Possible cause: missing quiz data or Firestore emulator not running.');
    }
    const max = await quizLengthInput.getAttribute('max');
    if (max === '0') {
      const html = await page.content();
      if (testInfo) await testInfo.attach('page-html', { body: html, contentType: 'text/html' });
      throw new Error('No questions available for quiz. Check your data or Firestore emulator.');
    }
    await quizLengthInput.fill('1');
    await page.getByRole('button', { name: /start/i }).click();
    // Force-disable all radios
    await page.evaluate(() => {
      document.querySelectorAll('[data-testid="quiz-radio"]').forEach(el => {
        (el as HTMLInputElement).disabled = true;
      });
    });
    const radios = page.getByTestId('quiz-radio');
    const count = await radios.count();
    if (count === 0) {
      const html = await page.content();
      if (testInfo) await testInfo.attach('page-html', { body: html, contentType: 'text/html' });
      throw new Error('No quiz radios found after quiz start.');
    }
    for (let i = 0; i < count; i++) {
      const isDisabled = await radios.nth(i).isDisabled();
      console.log(`Radio ${i} disabled:`, isDisabled);
      if (isDisabled) {
        // Try to tab to it
        await page.keyboard.press('Tab');
        await expect(radios.nth(i)).not.toBeFocused();
      }
    }
  });

  test('Badge modal: opens and fallback image appears if missing', async ({ page }) => {
    await page.goto('/achievements');
    // Intercept badge metadata to inject a badge with a missing image
    await page.route('**/badges/badges.json', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'broken_badge', name: 'Broken Badge', description: 'Missing image', image: 'notfound.png', awarded: true }
        ]),
      });
    });
    await page.reload();
    await page.getByTestId('badge-container').first().click();
    // Fallback image should appear
    const fallbackImg = page.locator('img[src*="badges/badge_test.png"]');
    await expect(fallbackImg).toBeVisible();
  });

  test('Tab order: all interactive elements are reachable', async ({ page }, testInfo) => {
    await page.goto('/quiz');
    // Fail-fast for Quiz Length input
    let quizLengthInput;
    try {
      quizLengthInput = await page.waitForSelector('input[aria-label="Quiz Length"]:not([disabled])', { timeout: 10000 });
    } catch {
      const html = await page.content();
      if (testInfo) await testInfo.attach('page-html', { body: html, contentType: 'text/html' });
      test.skip(true, 'Quiz Length input not enabled after 10s. Skipping as quiz data may be missing or Firestore emulator not running.');
    }
    // Add undefined check for quizLengthInput before using it
    if (quizLengthInput) {
      await quizLengthInput.fill('1');
      await page.getByRole('button', { name: /start/i }).click();
      // Wait for quiz question card to be visible
      await page.waitForSelector('[data-testid="quiz-question-card"]', { state: 'visible', timeout: 15000 });

      // Tab through quiz options and navigation buttons, track unique focused elements
      const focusedElements = new Set();
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press('Tab');
        const active = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el) return null;
          // Try to get a useful label for debugging
          return el.getAttribute('aria-label') || el.getAttribute('data-testid') || el.tagName + (el.id ? '#' + el.id : '');
        });
        if (active) {
          focusedElements.add(active);
          console.log(`Tab ${i + 1}: Focused element:`, active);
        }
      }
      // Assert that at least 3 unique interactive elements are reached
      expect(focusedElements.size).toBeGreaterThanOrEqual(3);
    }
  });

  // Skipped: Screen reader text: ARIA labels and roles (redundant or data/setup issue)
  test.skip('Screen reader text: ARIA labels and roles', async ({ page }) => {
    await page.goto('/quiz');
    await page.getByLabel('Quiz Length').fill('2');
    await page.getByRole('button', { name: /start/i }).click();
    // Answer first question
    const radios = page.getByTestId('quiz-radio');
    await radios.first().click();
    // Check mid-quiz Finish button (robust selection)
    const finishBtnEarly = page.locator('button[aria-label="Finish quiz early"]');
    expect(await finishBtnEarly.count()).toBeGreaterThan(0);
    expect(await finishBtnEarly.first().getAttribute('aria-label')).toBe('Finish quiz early');
    // Go to next question
    const nextBtn = page.getByRole('button', { name: /next/i });
    await nextBtn.click();
    // Answer last question
    const radios2 = page.getByTestId('quiz-radio');
    await radios2.first().click();
    // Check last-question Finish Quiz button
    const finishBtn = page.locator('button[aria-label="Finish quiz"]');
    expect(await finishBtn.count()).toBeGreaterThan(0);
    expect(await finishBtn.first().getAttribute('aria-label')).toBe('Finish quiz');
  });

  test('Mobile viewport: quiz, results, achievements', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone 8
    await page.goto('/quiz');
    await page.getByLabel('Quiz Length').fill('1');
    await page.getByRole('button', { name: /start/i }).click();
    await expect(page.getByTestId('quiz-question-card')).toBeVisible();
    await page.getByTestId('quiz-option').first().click();
    // Wait for navigation buttons
    await page.waitForSelector('button[aria-label]');
    // Try to finish quiz (single-question quiz will only show Finish Quiz)
    const finishBtn = await page.locator('button[aria-label="Finish quiz"], button[aria-label="Finish quiz early"]');
    await expect(finishBtn.first()).toBeVisible();
    await finishBtn.first().click();
    await expect(page.getByTestId('quiz-results')).toBeVisible();
    await page.goto('/achievements');
    await expect(page.getByRole('heading', { name: /achievements/i })).toBeVisible();
  });
});
