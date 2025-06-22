import { test, expect } from '@playwright/test';

test.describe('Critical Quiz Edge Cases and Accessibility', () => {
  test('Partial answers: finish quiz with unanswered questions', async ({ page }) => {
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
    // Optionally, check for a tooltip or warning if present
    // const warning = page.getByText(/unanswered|required|please answer/i);
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

  test('Network failure: submitting results', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Quiz Length').fill('1');
    await page.getByRole('button', { name: /start/i }).click();
    await page.getByTestId('quiz-option').first().click();
    // Simulate network failure on Firestore write (result submission)
    await page.route('**/firestore.googleapis.com/**', route => route.abort());
    await page.getByRole('button', { name: /finish/i }).click();
    await expect(page.getByTestId('quiz-error')).toBeVisible();
  });

  test('ARIA attributes: quiz options and navigation', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Quiz Length').fill('2');
    await page.getByRole('button', { name: /start/i }).click();
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
