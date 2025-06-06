import { test, expect } from '@playwright/test';

test.describe('AnalyticsModal Advanced E2E', () => {
  test('visual regression: analytics modal', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="analytics-btn-header"]').click();
    const modal = page.locator('[data-testid="analytics-modal"]');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveScreenshot('analytics-modal-default.png');
  });

  test('focus returns to trigger after modal close', async ({ page }) => {
    await page.goto('/');
    const trigger = page.locator('[data-testid="analytics-btn-header"]');
    await trigger.focus();
    await trigger.click();
    const modal = page.locator('[data-testid="analytics-modal"]');
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('analytics state matches UI after quiz completion', async ({ page }) => {
    await page.goto('/');
    // Simulate quiz completion and analytics update
    await page.evaluate(() => { window.__E2E_DEBUG_STATE__ = { quizCompleted: true, analytics: { quizzesTaken: 2 } }; });
    await page.locator('[data-testid="analytics-btn-header"]').click();
    await expect(page.getByText(/quizzes taken: 2/i)).toBeVisible();
    const debugState = await page.evaluate(() => window.__E2E_DEBUG_STATE__ as { analytics: { quizzesTaken: number } });
    expect(debugState.analytics.quizzesTaken).toBe(2);
  });

  test('analytics modal is announced to screen readers', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="analytics-btn-header"]').click();
    const modal = page.locator('[data-testid="analytics-modal"]');
    const handle = await modal.elementHandle();
    if (handle) {
      const snapshot = await page.accessibility.snapshot({ root: handle });
      if (snapshot) {
        expect(snapshot.role).toBe('dialog');
        expect(snapshot.name?.toLowerCase()).toContain('analytics');
      }
    }
  });

  test('analytics modal persists after reload', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => { window.__E2E_DEBUG_STATE__ = { analytics: { quizzesTaken: 3 } }; });
    await page.reload();
    await page.locator('[data-testid="analytics-btn-header"]').click();
    await expect(page.getByText(/quizzes taken: 3/i)).toBeVisible();
  });

  test('handles edge cases: long names, many badges, zero/max values', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.__E2E_DEBUG_STATE__ = {
        analytics: {
          quizzesTaken: 0,
          badgesEarned: 100,
          userName: 'A very very very long user name for edge case testing',
        },
        badges: Array.from({ length: 50 }, (_, i) => ({
          id: `b${i}`,
          name: `Badge ${i} with a very long name for edge case testing`,
          earned: i % 2 === 0,
        })),
      };
    });
    await page.reload();
    await page.locator('[data-testid="analytics-btn-header"]').click();
    await expect(page.getByText(/quizzes taken: 0/i)).toBeVisible();
    await expect(page.getByText(/badges earned: 100/i)).toBeVisible();
    await expect(page.getByText(/very long user name/i)).toBeVisible();
    // Check that many badges are rendered
    const badges = page.locator('[data-testid^="badge-earned-"], [data-testid^="badge-unearned-"]');
    expect(await badges.count()).toBeGreaterThan(20);
  });
});
