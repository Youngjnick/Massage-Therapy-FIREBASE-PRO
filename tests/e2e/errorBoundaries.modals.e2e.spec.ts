import { test, expect } from '@playwright/test';

test('SmartLearningModal shows custom error fallback and feedback', async ({ page }) => {
  await page.goto('/');
  // Simulate smart learning error
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_SMART_LEARNING_ERROR__?: boolean }).__FORCE_SMART_LEARNING_ERROR__ = true;
  });
  // Open smart learning modal (replace with your actual trigger)
  await page.locator('[data-testid="smart-learning-btn-header"]').click();
  // Wait for custom fallback
  await expect(page.getByText(/smart learning failed to load|please try again later/i)).toBeVisible();
  // Feedback button
  const reportBtn = page.getByRole('button', { name: /report this issue/i });
  await expect(reportBtn).toBeVisible();
  await reportBtn.click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByLabel('Describe what happened').fill('Smart learning error feedback from E2E');
  await page.getByRole('button', { name: /submit/i }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  // Clear error and check recovery
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_SMART_LEARNING_ERROR__?: boolean }).__FORCE_SMART_LEARNING_ERROR__ = false;
  });
  await page.reload();
  // Optionally, check for main smart learning UI element
  // await expect(page.locator('[data-testid="smart-learning-main"]')).toBeVisible();
});

test('SettingsModal shows custom error fallback and feedback', async ({ page }) => {
  await page.goto('/');
  // Simulate settings error
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_SETTINGS_ERROR__?: boolean }).__FORCE_SETTINGS_ERROR__ = true;
  });
  // Open settings modal (replace with your actual trigger)
  await page.locator('[data-testid="settings-btn-header"]').click();
  await expect(page.getByText(/settings failed to load|please try again later/i)).toBeVisible();
  const reportBtn = page.getByRole('button', { name: /report this issue/i });
  await expect(reportBtn).toBeVisible();
  await reportBtn.click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByLabel('Describe what happened').fill('Settings error feedback from E2E');
  await page.getByRole('button', { name: /submit/i }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  // Clear error and check recovery
  await page.evaluate(() => {
    (window as typeof window & { __FORCE_SETTINGS_ERROR__?: boolean }).__FORCE_SETTINGS_ERROR__ = false;
  });
  await page.reload();
  // Optionally, check for main settings UI element
  // await expect(page.locator('[data-testid="settings-main"]')).toBeVisible();
});
