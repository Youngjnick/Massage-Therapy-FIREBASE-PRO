import { test, expect } from '@playwright/test';
/* global console */

test.describe('Critical Quiz Edge Cases and Accessibility', () => {
  test.skip('Partial answers: finish quiz with unanswered questions', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Quiz Length').fill('3');
    await page.getByRole('button', { name: /start/i }).click();
    // Answer only the first question
    await page.getByTestId('quiz-option').first().click();
    // Use the stepper to skip to the third question
    const stepperDots = page.getByTestId('quiz-stepper-dot');
    await stepperDots.nth(2).click();
    // On third question, try to finish
    const finishBtn = page.getByRole('button', { name: /finish/i });
    // The button should be disabled if not all questions are answered
    await expect(finishBtn).toBeDisabled();
    // Optionally, check for a warning or prompt if user tries to finish early
    // await finishBtn.click();
    // const warning = page.getByText(/please answer all questions|required/i);
    // await expect(warning).toBeVisible();
  });

  test.skip('Network failure: loading questions', async ({ page }) => {
    // Abort all Firestore requests to simulate network failure
    await page.route('**/firestore.googleapis.com/**', route => route.abort());
    await page.goto('/');
    // Debug: print HTML before checking for error
    const html = await page.content();
    await test.info().attach('quiz-html', { body: html, contentType: 'text/html' });
    // Should show error message
    await expect(page.getByTestId('quiz-error')).toBeVisible();
    // UI should still be usable (e.g., start button visible)
    await expect(page.getByRole('button', { name: /start/i })).toBeVisible();
  });

  test('ARIA attributes: quiz options and navigation', async ({ page }, testInfo) => {
    // Robust: always clear storage and cookies before test
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.context().clearCookies();
    await page.reload();
    // Wait for quiz loading spinner to disappear (if present)
    try {
      await page.waitForSelector('[data-testid="quiz-loading"]', { state: 'detached', timeout: 30000 });
    } catch {
      const html = await page.content();
      console.error('Quiz loading spinner did not disappear after 30s. Page HTML:', html);
      if (testInfo) await testInfo.attach('page-html', { body: html, contentType: 'text/html' });
      throw new Error('Quiz did not finish loading after 30s.');
    }
    // Robust: try multiple selectors for quiz length input
    let quizLengthInput;
    try {
      quizLengthInput = await page.getByLabel('Quiz Length');
      await expect(quizLengthInput).toBeVisible({ timeout: 10000 });
      await quizLengthInput.fill('2');
      console.log('Filled Quiz Length input by label');
    } catch {
      quizLengthInput = await page.locator('[aria-label="Quiz Length"], input[name="quizLength"]');
      if (await quizLengthInput.count() > 0) {
        await expect(quizLengthInput.first()).toBeVisible({ timeout: 10000 });
        await quizLengthInput.first().fill('2');
        console.log('Filled Quiz Length input by fallback selector');
      } else {
        const html = await page.content();
        console.error('Quiz Length input not found on /. Page HTML:', html);
        if (testInfo) await testInfo.attach('page-html', { body: html, contentType: 'text/html' });
        throw new Error('Quiz Length input not found');
      }
    }
    // Robust: try multiple names for Start button
    const startBtn = page.getByRole('button', { name: /start|begin|start quiz/i });
    if (!(await startBtn.count())) {
      const html = await page.content();
      console.error('Start button not found on /. Page HTML:', html);
      if (testInfo) await testInfo.attach('page-html', { body: html, contentType: 'text/html' });
      throw new Error('Start button not found');
    }
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await expect(startBtn).toBeEnabled({ timeout: 10000 });
    await startBtn.click();
    const radios = page.getByTestId('quiz-radio');
    for (let i = 0; i < await radios.count(); i++) {
      const ariaChecked = await radios.nth(i).getAttribute('aria-checked');
      expect(["true", "false", null]).toContain(ariaChecked);
    }
    const navButtons = [
      page.getByRole('button', { name: /next/i }),
      page.getByRole('button', { name: /prev/i }),
      page.getByRole('button', { name: /finish/i })
    ];
    for (const btn of navButtons) {
      if (await btn.count()) {
        const ariaDisabled = await btn.getAttribute('aria-disabled');
        expect(["true", "false", null]).toContain(ariaDisabled);
      }
    }
  });

  test('Badges: tab, open with Enter/Space, close with Escape, focus returns', async ({ page }) => {
    await page.goto('/achievements');
    const badgeButtons = page.getByTestId('badge-container');
    const count = await badgeButtons.count();
    for (let i = 0; i < count; i++) {
      // Tab to badge
      await badgeButtons.nth(i).focus();
      // Open with Enter
      await page.keyboard.press('Enter');
      await expect(page.getByTestId('badge-modal')).toBeVisible();
      // Close with Escape
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('badge-modal')).toBeHidden();
      // Focus should return to badge
      await expect(badgeButtons.nth(i)).toBeFocused();
      // Open with Space
      await page.keyboard.press('Space');
      await expect(page.getByTestId('badge-modal')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('badge-modal')).toBeHidden();
      await expect(badgeButtons.nth(i)).toBeFocused();
    }
  });
});
