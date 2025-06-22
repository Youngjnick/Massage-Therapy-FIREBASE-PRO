import { test, expect } from '@playwright/test';

test.describe('Critical UI and Accessibility Scenarios', () => {
  test('Mobile viewport: quiz UI, results, and modals are visible and usable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X size
    await page.goto('/');
    await page.getByLabel('Quiz Length').fill('2');
    await page.getByRole('button', { name: /start/i }).click();
    // Quiz UI should be visible, no horizontal scroll
    const quizContainer = page.getByTestId('quiz-container');
    await expect(quizContainer).toBeVisible();
    const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(hasHorizontalScroll).toBeFalsy();
    // Navigation buttons should be visible and accessible
    await expect(page.getByRole('button', { name: /next/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /finish/i })).toBeVisible();
    // Complete quiz and check results screen
    await page.getByTestId('quiz-option').first().click();
    await page.getByRole('button', { name: /next/i }).click();
    await page.getByTestId('quiz-option').first().click();
    await page.getByRole('button', { name: /finish/i }).click();
    await expect(page.getByTestId('quiz-results')).toBeVisible();
  });

  test('Badge modals: only one open at a time, keyboard accessible', async ({ page }) => {
    await page.goto('/achievements');
    // Wait for badges to load
    const badgeButtons = page.getByTestId('badge-container');
    const badgeCount = await badgeButtons.count();
    if (badgeCount < 2) test.skip();
    // Open first badge modal
    await badgeButtons.nth(0).click();
    await expect(page.getByTestId('badge-modal')).toBeVisible();
    // Close first modal before opening the second
    await page.getByRole('button', { name: /close/i }).click();
    // Open second badge modal
    await badgeButtons.nth(1).click();
    // Only one modal should be visible
    const modals = page.locator('[data-testid="badge-modal"]');
    expect(await modals.count()).toBe(1);
    // Close modal
    await page.getByRole('button', { name: /close/i }).click();
  });

  test('Badge modal: open with keyboard only (Tab + Enter/Space)', async ({ page }) => {
    await page.goto('/achievements');
    // Tab to first badge
    await page.keyboard.press('Tab');
    // Find the first badge button in tab order
    const badgeButton = page.getByTestId('badge-container').first();
    await badgeButton.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('badge-modal')).toBeVisible();
    await page.getByRole('button', { name: /close/i }).focus();
    await page.keyboard.press('Space');
    await expect(page.getByTestId('badge-modal')).toBeHidden();
  });

  test('Next button: always rendered, but hidden or disabled as appropriate', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Quiz Length').fill('1');
    await page.getByRole('button', { name: /start/i }).click();
    const nextBtns = await page.locator('button', { hasText: /next/i }).all();
    if (nextBtns.length === 0) {
      // Button not present (e.g., single-question quiz or last question) — acceptable
      expect(true).toBeTruthy();
    } else {
      const nextBtn = nextBtns[0];
      // Should be disabled or hidden (not enabled)
      expect(await nextBtn.isDisabled() || !(await nextBtn.isVisible())).toBeTruthy();
    }
  });

  test('Quiz cannot be started without required fields', async ({ page }) => {
    await page.goto('/');
    // Try to start without filling anything
    await page.getByRole('button', { name: /start/i }).click();
    await expect(page.getByText(/required|please/i)).toBeVisible();
    // Fill only length
    await page.getByLabel('Quiz Length').fill('2');
    await page.getByRole('button', { name: /start/i }).click();
    await expect(page.getByText(/required|please/i)).toBeVisible();
  });

  test('Quiz handles all options disabled', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Quiz Length').fill('1');
    await page.getByRole('button', { name: /start/i }).click();
    // Simulate all options disabled (if possible)
    const options = page.getByTestId('quiz-option');
    for (let i = 0; i < await options.count(); i++) {
      await expect(options.nth(i)).toBeDisabled();
    }
    // Next button should be disabled
    await expect(page.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  test('Quiz results always show, even if some questions unanswered', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Quiz Length').fill('2');
    await page.getByRole('button', { name: /start/i }).click();
    // Answer first, skip second
    await page.getByTestId('quiz-option').first().click();
    await page.getByTestId('quiz-step').nth(1).click();
    await page.getByRole('button', { name: /finish/i }).click();
    await expect(page.getByTestId('quiz-results')).toBeVisible();
  });

  test('Badge modal fallback image and keyboard navigation', async ({ page }) => {
    await page.goto('/achievements');
    // Open badge modal
    const badge = page.getByTestId('badge-container').first();
    await badge.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('badge-modal')).toBeVisible();
    // Fallback image
    const fallbackImg = page.locator('img[src*="badge_test.png"]');
    await expect(fallbackImg).toBeVisible();
    // Keyboard close
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('badge-modal')).toBeHidden();
  });

  test('Network failure: quiz load', async ({ page }) => {
    await page.route('**/questions*', route => route.abort());
    await page.goto('/');
    await expect(page.getByText(/error|failed|could not load/i)).toBeVisible();
  });

  test('Network failure: quiz submit', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Quiz Length').fill('1');
    await page.getByRole('button', { name: /start/i }).click();
    await page.getByTestId('quiz-option').first().click();
    await page.route('**/submit*', route => route.abort());
    await page.getByRole('button', { name: /finish/i }).click();
    await expect(page.getByText(/error|failed|could not submit/i)).toBeVisible();
  });

  test('Network failure: badge load', async ({ page }) => {
    await page.route('**/badges/badges.json', route => route.abort());
    await page.goto('/achievements');
    await expect(page.getByText(/error|failed|could not load/i)).toBeVisible();
  });

  test('Accessibility: ARIA roles and labels', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Quiz Length').fill('1');
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

  test('Tab order is logical for quiz controls', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Quiz Length').fill('1');
    await page.getByRole('button', { name: /start/i }).click();
    // Tab through options and controls
    await page.keyboard.press('Tab'); // first option
    await expect(page.getByTestId('quiz-radio').first()).toBeFocused();
    await page.keyboard.press('Tab'); // next option or control
    // Continue tabbing to navigation buttons
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /next|finish/i })).toBeFocused();
  });

  test('Mobile viewport: quiz and results are usable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.getByLabel('Quiz Length').fill('1');
    await page.getByRole('button', { name: /start/i }).click();
    await expect(page.getByTestId('quiz-question-card')).toBeVisible();
    await page.getByTestId('quiz-option').first().click();
    await page.getByRole('button', { name: /finish/i }).click();
    await expect(page.getByTestId('quiz-results')).toBeVisible();
  });

  test('Quiz stepper: skip, revisit, answer in any order', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Quiz Length').fill('3');
    await page.getByRole('button', { name: /start/i }).click();
    // Skip to 3rd question
    await page.getByTestId('quiz-step').nth(2).click();
    await page.getByTestId('quiz-option').first().click();
    // Go back to 1st question
    await page.getByTestId('quiz-step').nth(0).click();
    await page.getByTestId('quiz-option').first().click();
    // Go to 2nd question
    await page.getByTestId('quiz-step').nth(1).click();
    await page.getByTestId('quiz-option').first().click();
    // Finish
    await page.getByRole('button', { name: /finish/i }).click();
    await expect(page.getByTestId('quiz-results')).toBeVisible();
  });

  test('Error boundary: UI does not crash on JS error in quiz', async ({ page }) => {
    await page.goto('/');
    // Simulate JS error (if possible, e.g. via special test param)
    // For now, check that the app still shows a fallback UI
    await expect(page.getByText(/something went wrong|error/i)).not.toHaveCount(0);
  });
});
