import { test, expect } from '@playwright/test';

// Helper to open the first badge details modal (by click or keyboard)
async function openBadgeDetailsModal(page: import('@playwright/test').Page) {
  // Wait for at least one badge card
  const badgeCard = page.locator('[data-testid^="badge-earned-"]').first();
  await expect(badgeCard).toBeVisible();
  // Open by click
  await badgeCard.click();
  // Wait for modal
  await expect(page.locator('[data-testid="badge-details-modal"]')).toBeVisible();
}

test.describe('BadgeDetailsModal E2E', () => {
  test('opens and closes with mouse and keyboard, is accessible', async ({ page }) => {
    await page.goto('/');
    await openBadgeDetailsModal(page);
    const modal = page.locator('[data-testid="badge-details-modal"]');
    // Check ARIA attributes
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    // Focus trap: focus modal and tab to close button
    await modal.focus();
    await page.keyboard.press('Tab');
    // Escape closes modal
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
    // Reopen and check accessibility snapshot
    await openBadgeDetailsModal(page);
    const modalHandle = await modal.elementHandle();
    if (modalHandle) {
      const snapshot = await page.accessibility.snapshot({ root: modalHandle });
      expect(snapshot).toMatchObject({ role: 'dialog' });
    }
  });

  test('shows badge details and is screen reader accessible', async ({ page }) => {
    await page.goto('/');
    await openBadgeDetailsModal(page);
    // Badge name, description, and image should be visible
    const name = page.locator('[data-testid="badge-details-name"]');
    const desc = page.locator('[data-testid="badge-details-desc"]');
    const img = page.locator('[data-testid="badge-details-img"]');
    await expect(name).toBeVisible();
    await expect(desc).toBeVisible();
    await expect(img).toBeVisible();
    const nameText = await name.textContent();
    await expect(img).toHaveAttribute('alt', nameText ?? '');
  });

  test('shows error/empty state if badge is missing', async ({ page }) => {
    await page.goto('/');
    // Simulate error state for badge details
    await page.evaluate(() => {
      window.__E2E_DEBUG_STATE__ = { badgeDetailsError: true };
    });
    // Try to open badge details modal
    const badgeCard = page.locator('[data-testid^="badge-earned-"]').first();
    await expect(badgeCard).toBeVisible();
    await badgeCard.click();
    const modal = page.locator('[data-testid="badge-details-modal"]');
    await expect(modal).toBeVisible();
    await expect(page.getByText(/not found|error|empty/i)).toBeVisible();
  });
});
