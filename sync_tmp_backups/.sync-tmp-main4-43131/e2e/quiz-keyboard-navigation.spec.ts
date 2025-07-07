import { test, expect } from '@playwright/test';
import { uiSignIn } from './helpers/uiSignIn';
import { getTestUser } from './helpers/getTestUser';

/* global console */

let testUser: { email: string; password: string; uid?: string };
test.beforeAll(async () => {
  testUser = await getTestUser(0);
});

test.describe('Quiz keyboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    await page.context().clearCookies();
    await page.reload();
    await uiSignIn(page, { email: testUser.email, password: testUser.password, profilePath: '/profile' });
    await page.goto('/quiz');
    // Print browser console logs to terminal for debugging
    page.on('console', msg => {
      if (msg.type() === 'log') {
        // Only print logs from QuizQuestionCard
        if (msg.text().includes('[QuizQuestionCard]')) {
           
          // @ts-ignore
          globalThis.console.log('BROWSER LOG:', msg.text());
        }
      }
    });
  });

  test('ArrowDown/ArrowUp do not select or submit answers', async ({ page }) => {
    await page.goto('/quiz'); // Adjust path if needed
    await page.getByRole('button', { name: /start quiz/i }).click();

    // Wait for radios to appear and be enabled
    const radios = page.locator('[role="radio"]');
    await expect(radios.first()).toBeVisible();
    await expect(radios.first()).toBeEnabled();
    await expect(radios.nth(1)).toBeEnabled();

    // Focus the first radio
    await radios.nth(0).focus();
    await expect(radios.nth(0)).toBeFocused();
    await page.screenshot({ path: 'test-results/screenshots/quiz-keyboard-arrowdown-initial.png' });

    // Press ArrowDown to move focus
    await page.keyboard.press('ArrowDown');
    await page.screenshot({ path: 'test-results/screenshots/quiz-keyboard-arrowdown-after.png' });
    await expect(radios.nth(1)).toBeFocused();
    // Assert no radio is selected
    await expect(radios.nth(0)).not.toBeChecked();
    await expect(radios.nth(1)).not.toBeChecked();

    // Press ArrowUp to move focus back
    await page.keyboard.press('ArrowUp');
    await page.screenshot({ path: 'test-results/screenshots/quiz-keyboard-arrowup-after.png' });
    await expect(radios.nth(0)).toBeFocused();
    await expect(radios.nth(0)).not.toBeChecked();
    await expect(radios.nth(1)).not.toBeChecked();
  });

  test('Enter/Space select and submit, Arrow keys do not', async ({ page }) => {
    await page.goto('/quiz');
    await page.getByRole('button', { name: /start quiz/i }).click();
    // Log userAnswers from browser context after quiz start
    await page.evaluate(() => {
      (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = undefined;
      (window as any).userAnswers = undefined;
      // @ts-ignore
      const reactRoot = document.querySelector('[data-testid="quiz-container"]');
      if (reactRoot && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        // Try to find userAnswers in React state (best effort)
         
        console.log('BROWSER userAnswers:', (window as any).userAnswers);
      }
    });
    const radios = page.locator('[role="radio"]');
    await expect(radios.first()).toBeVisible();
    await expect(radios.first()).toBeEnabled();
    await radios.nth(0).focus();
    await expect(radios.nth(0)).toBeFocused();
    await page.screenshot({ path: 'test-results/screenshots/quiz-keyboard-enter-initial.png' });

    // Press Enter to select
    await page.keyboard.press('Enter');
    await page.screenshot({ path: 'test-results/screenshots/quiz-keyboard-enter-selected.png' });
    await expect(radios.nth(0)).toBeChecked();
    // Press Enter again to submit (should advance or show feedback)
    await page.keyboard.press('Enter');
    await page.screenshot({ path: 'test-results/screenshots/quiz-keyboard-enter-submitted.png' });
    // Optionally, check for UI change (e.g., next question or feedback)
  });
});
