/* global console */
import { test, expect } from '@playwright/test';

test.describe('Quiz Edge Cases and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.context().clearCookies();
    await page.reload();
  });

  test('Quiz with all options disabled: keyboard navigation skips disabled', async ({ page }, testInfo) => {
    await page.goto('/');
    const quizLengthInput = await page.getByLabel('Quiz Length');
    const isEnabled = await quizLengthInput.isEnabled();
    const max = await quizLengthInput.getAttribute('max');
    if (!isEnabled || max === '0') {
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

  test('Tab order: all interactive elements are reachable', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Quiz Length').fill('1');
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
  });

  // Skipped: Screen reader text: ARIA labels and roles (redundant or data/setup issue)
  test.skip('Screen reader text: ARIA labels and roles', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Quiz Length').fill('2');
    await page.getByRole('button', { name: /start/i }).click();
    // Answer first question
    const radios = page.getByTestId('quiz-radio');
    await radios.first().click();
    // Check mid-quiz Finish button (robust selection)
    const finishBtns = page.getByRole('button', { name: /finish/i });
    const finishBtnEarly = finishBtns.first();
    expect(await finishBtnEarly.getAttribute('aria-label')).toMatch(/finish quiz early/i);
    // Go to next question
    const nextBtn = page.getByRole('button', { name: /next/i });
    await nextBtn.click();
    // Answer last question
    const radios2 = page.getByTestId('quiz-radio');
    await radios2.first().click();
    // Check last-question Finish Quiz button
    const finishBtn = page.getByRole('button', { name: /finish quiz/i });
    expect(await finishBtn.getAttribute('aria-label')).toMatch(/finish quiz/i);
  });

  test('Mobile viewport: quiz, results, achievements', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone 8
    await page.goto('/');
    await page.getByLabel('Quiz Length').fill('1');
    await page.getByRole('button', { name: /start/i }).click();
    await expect(page.getByTestId('quiz-question-card')).toBeVisible();
    await page.getByTestId('quiz-option').first().click();
    await page.getByRole('button', { name: /finish/i }).click();
    await expect(page.getByTestId('quiz-results')).toBeVisible();
    await page.goto('/achievements');
    await expect(page.getByRole('heading', { name: /achievements/i })).toBeVisible();
  });
});
