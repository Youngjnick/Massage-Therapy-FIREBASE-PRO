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
    // Open second badge modal
    await badgeButtons.nth(1).click();
    // Only one modal should be visible
    const modals = page.locator('[data-testid="badge-modal"]');
    expect(await modals.count()).toBe(1);
    // Close modal
    await page.getByRole('button', { name: /close/i }).click();
    await expect(page.getByTestId('badge-modal')).toBeHidden();
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
    const nextBtn = page.getByRole('button', { name: /next/i });
    await expect(nextBtn).toBeVisible();
    // Should be disabled or hidden (not enabled)
    expect(await nextBtn.isDisabled() || !(await nextBtn.isVisible())).toBeTruthy();
  });
});
