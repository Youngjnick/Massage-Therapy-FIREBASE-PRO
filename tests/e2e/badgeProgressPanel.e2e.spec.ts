import { test, expect } from '@playwright/test';

// Helper to get badge grid columns
async function getGridColumnCount(page: import('@playwright/test').Page) {
  return await page.evaluate(() => {
    const panel = document.querySelector('[data-testid="badge-progress-panel"]');
    if (!panel) return 0;
    const style = window.getComputedStyle(panel);
    const columns = style.gridTemplateColumns || '';
    return columns.split(' ').length;
  });
}

test.describe('BadgeProgressPanel Responsive E2E', () => {
  test('shows 2 columns on mobile, 3 on tablet, 4 on desktop', async ({ page }) => {
    await page.goto('/');
    // Mobile
    await page.setViewportSize({ width: 400, height: 800 });
    await expect(page.locator('[data-testid="badge-progress-panel"]')).toBeVisible();
    let columns = await getGridColumnCount(page);
    expect(columns).toBe(2);
    // Tablet
    await page.setViewportSize({ width: 700, height: 800 });
    columns = await getGridColumnCount(page);
    expect(columns).toBe(3);
    // Desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    columns = await getGridColumnCount(page);
    expect(columns).toBe(4);
  });

  test('all badges are keyboard accessible and have correct ARIA', async ({ page }) => {
    await page.goto('/');
    const badges = page.locator('[data-testid^="badge-earned-"], [data-testid^="badge-unearned-"]');
    const count = await badges.count();
    for (let i = 0; i < count; i++) {
      const badge = badges.nth(i);
      await badge.focus();
      await expect(badge).toBeFocused();
      await expect(badge).toHaveAttribute('role', 'checkbox');
      await expect(badge).toHaveAttribute('aria-checked');
      await expect(badge).toHaveAttribute('aria-describedby');
    }
  });

  test('badge images have correct alt text', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('[data-testid^="badge-img-"]');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      await expect(img).toHaveAttribute('alt');
    }
  });

  test('shows loading, error, and empty states accessibly', async ({ page }) => {
    await page.goto('/');
    // Simulate loading
    await page.evaluate(() => { window.__E2E_DEBUG_STATE__ = { badgePanelLoading: true }; });
    await expect(page.getByText(/loading/i)).toBeVisible();
    // Simulate error
    await page.evaluate(() => { window.__E2E_DEBUG_STATE__ = { badgePanelError: 'Network error' }; });
    await page.reload();
    await expect(page.getByText(/network error/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
    // Simulate empty
    await page.evaluate(() => { window.__E2E_DEBUG_STATE__ = { badgePanelEmpty: true }; });
    await page.reload();
    await expect(page.getByText(/no badges|empty/i)).toBeVisible();
  });

  test('panel accessibility snapshot', async ({ page }) => {
    await page.goto('/');
    const panel = page.locator('[data-testid="badge-progress-panel"]');
    const handle = await panel.elementHandle();
    if (handle) {
      const snapshot = await page.accessibility.snapshot({ root: handle });
      expect(snapshot).toBeDefined();
    }
  });
});
