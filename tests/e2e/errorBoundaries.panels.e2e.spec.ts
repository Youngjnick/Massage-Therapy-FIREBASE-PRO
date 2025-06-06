import { test, expect } from '@playwright/test';

test('AnalyticsModal shows custom error fallback and feedback', async ({ page }) => {
  await page.goto('/');
  // Simulate analytics error
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_ANALYTICS_ERROR__?: boolean }).__FORCE_ANALYTICS_ERROR__ = true;
  });
  // Open analytics modal
  await page.locator('[data-testid="analytics-btn-header"]').click();
  // Wait for custom fallback
  await expect(page.getByText(/analytics failed to load/i)).toBeVisible();
  // Feedback button
  const reportBtn = page.getByRole('button', { name: /report this issue/i });
  await expect(reportBtn).toBeVisible();
  await reportBtn.click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByLabel('Describe what happened').fill('Analytics error feedback from E2E');
  await page.getByRole('button', { name: /submit/i }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
});

test('ProfileModal shows custom error fallback and feedback', async ({ page }) => {
  await page.goto('/');
  // Simulate profile error
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_PROFILE_ERROR__?: boolean }).__FORCE_PROFILE_ERROR__ = true;
  });
  // Open profile modal (replace with your actual trigger)
  await page.locator('[data-testid="profile-btn-header"]').click();
  await expect(page.getByText(/profile failed to load/i)).toBeVisible();
  const reportBtn = page.getByRole('button', { name: /report this issue/i });
  await expect(reportBtn).toBeVisible();
  await reportBtn.click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByLabel('Describe what happened').fill('Profile error feedback from E2E');
  await page.getByRole('button', { name: /submit/i }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
});
