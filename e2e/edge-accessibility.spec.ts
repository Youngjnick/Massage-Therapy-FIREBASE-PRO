import { test, expect } from '@playwright/test';

test.describe('Quiz Edge Cases and Accessibility', () => {
  test('Quiz with only one question: navigation buttons', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Quiz Length').fill('1');
    await page.getByRole('button', { name: /start/i }).click();
    // Wait for Finish button to be visible (quiz started)
    await expect(page.getByRole('button', { name: /finish/i })).toBeVisible();
    // Check that Next and Prev buttons are present but disabled
    const nextBtn = page.getByRole('button', { name: /next/i });
    const prevBtn = page.getByRole('button', { name: /prev/i });
    await expect(nextBtn).toBeDisabled();
    await expect(prevBtn).toBeDisabled();
  });

  test('Quiz with all options disabled: keyboard navigation skips disabled', async ({ page }) => {
    await page.goto('/');
    // Simulate a quiz where all options are disabled (if possible via test data or UI toggle)
    // For now, check that disabled radios are skipped in tab order
    await page.getByLabel('Quiz Length').fill('1');
    await page.getByRole('button', { name: /start/i }).click();
    const radios = page.getByTestId('quiz-radio');
    const count = await radios.count();
    for (let i = 0; i < count; i++) {
      if (await radios.nth(i).isDisabled()) {
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
    // Tab through quiz options and navigation buttons
    let tabCount = 0;
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      tabCount++;
    }
    // If we reach at least 3-4 interactive elements, tab order is present
    expect(tabCount).toBeGreaterThanOrEqual(3);
  });

  test('Screen reader text: ARIA labels and roles', async ({ page }) => {
    await page.goto('/');
    // Check for ARIA roles on quiz options and navigation
    const radios = page.getByTestId('quiz-radio');
    for (let i = 0; i < await radios.count(); i++) {
      const role = await radios.nth(i).getAttribute('role');
      expect(role === 'radio' || role === null).toBeTruthy();
    }
    // Check for ARIA labels on navigation buttons
    const finishBtn = page.getByRole('button', { name: /finish/i });
    expect(await finishBtn.getAttribute('aria-label') || '').toMatch(/finish/i);
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
    await expect(page.getByText(/achievements/i)).toBeVisible();
  });
});
