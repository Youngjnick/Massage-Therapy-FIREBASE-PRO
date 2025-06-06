import { test, expect } from '@playwright/test';

test.describe('BadgeProgressPanel Advanced E2E', () => {
  test('visual regression: badge panel', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="badge-progress-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="badge-progress-panel"]')).toHaveScreenshot('badge-panel-default.png');
  });

  test('focus returns to trigger after badge details modal close', async ({ page }) => {
    await page.goto('/');
    const badge = page.locator('[data-testid^="badge-earned-"]').first();
    await badge.focus();
    await badge.click();
    const modal = page.locator('[data-testid="badge-details-modal"]');
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
    await expect(badge).toBeFocused();
  });

  test('badge state matches UI after earning a badge', async ({ page }) => {
    await page.goto('/');
    // Simulate earning a badge
    await page.evaluate(() => { window.__E2E_DEBUG_STATE__ = { badges: [{ id: 'b1', name: 'Badge 1', earned: true }] }; });
    await page.reload();
    await expect(page.locator('[data-testid="badge-earned-b1"]')).toBeVisible();
    const debugState = await page.evaluate(() => window.__E2E_DEBUG_STATE__ as { badges: Array<{ earned: boolean }> });
    expect(debugState.badges[0].earned).toBe(true);
  });

  test('badge panel is announced to screen readers', async ({ page }) => {
    await page.goto('/');
    const panel = page.locator('[data-testid="badge-progress-panel"]');
    const handle = await panel.elementHandle();
    if (handle) {
      const snapshot = await page.accessibility.snapshot({ root: handle });
      if (snapshot) {
        expect(snapshot.role).toBe('list');
        expect(snapshot.name?.toLowerCase()).toContain('badges');
      }
    }
  });

  test('badge panel persists after reload', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => { window.__E2E_DEBUG_STATE__ = { badges: [{ id: 'b2', name: 'Badge 2', earned: true }] }; });
    await page.reload();
    await expect(page.locator('[data-testid="badge-earned-b2"]')).toBeVisible();
  });

  test('handles edge cases: long names, many badges', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.__E2E_DEBUG_STATE__ = {
        badges: Array.from({ length: 40 }, (_, i) => ({
          id: `b${i}`,
          name: `Badge ${i} with a very long name for edge case testing`,
          earned: i % 2 === 0,
        })),
      };
    });
    await page.reload();
    // Check that many badges are rendered
    const badges = page.locator('[data-testid^="badge-earned-"], [data-testid^="badge-unearned-"]');
    expect(await badges.count()).toBeGreaterThan(20);
    // Check for long name
    await expect(page.getByText(/very long name/i)).toBeVisible();
  });
});
