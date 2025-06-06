import { test, expect } from '@playwright/test';

test('BadgeProgressPanel shows custom error fallback and feedback', async ({ page }) => {
  await page.goto('/');
  // Simulate badge panel error
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_BADGE_ERROR__?: boolean }).__FORCE_BADGE_ERROR__ = true;
  });
  // Wait for custom fallback
  await expect(page.getByText(/badges? failed to load|please try again later/i)).toBeVisible();
  // Feedback button
  const reportBtn = page.getByRole('button', { name: /report this issue/i });
  await expect(reportBtn).toBeVisible();
  await reportBtn.click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByLabel('Describe what happened').fill('Badge panel error feedback from E2E');
  await page.getByRole('button', { name: /submit/i }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  // Clear error and check recovery
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_BADGE_ERROR__?: boolean }).__FORCE_BADGE_ERROR__ = false;
  });
  await page.reload();
  await expect(page.locator('[data-testid^="badge-earned-"]')).toBeVisible();
});

test('Simultaneous errors in badges and analytics show both fallbacks', async ({ page }) => {
  await page.goto('/');
  // Simulate errors in both panels
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_BADGE_ERROR__?: boolean }).__FORCE_BADGE_ERROR__ = true;
    (window as typeof window & { __FORCE_ANALYTICS_ERROR__?: boolean }).__FORCE_ANALYTICS_ERROR__ = true;
  });
  // Open analytics modal
  await page.locator('[data-testid="analytics-btn-header"]').click();
  await expect(page.getByText(/analytics failed to load|please try again later/i)).toBeVisible();
  // Badge panel fallback should also be visible
  await expect(page.getByText(/badges? failed to load|please try again later/i)).toBeVisible();
});
