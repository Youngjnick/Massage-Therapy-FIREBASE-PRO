// Example Playwright test for analytics modal
import { test, expect, Page } from '@playwright/test';
import { mockAuth, injectMinimumQuizState, waitForAppReady } from './helpers/e2eDebugHelpers';

// Helper to set mock auth before each test
async function setupMockAuth(page: Page) {
  await mockAuth(page);
}

test.describe('Analytics Modal', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      // eslint-disable-next-line no-console
      console.log(`[browser console.${msg.type()}]`, msg.text());
    });
    page.on('pageerror', error => {
      // eslint-disable-next-line no-console
      console.error('[browser pageerror]', error);
    });
  });

  test('Analytics Modal: open modal and display chart', async ({ page }) => {
    await setupMockAuth(page);
    await page.goto('http://localhost:5173');
    await waitForAppReady(page);
    await injectMinimumQuizState(page);
    // Wait for the analytics button to be visible (header button)
    await expect(page.locator('[data-testid="open-analytics-btn"]').first()).toBeVisible();
    await page.locator('[data-testid="open-analytics-btn"]').first().click();
    // Wait for the analytics modal
    await expect(page.getByTestId('analytics-modal')).toBeVisible();
    // Wait for the Quiz Accuracy Chart to be visible
    await expect(page.getByRole('img', { name: 'Quiz Accuracy Chart' })).toBeVisible();
    const modal = await page.getByTestId('analytics-modal');
    expect(modal).not.toBeNull();
    const chart = await page.getByRole('img', { name: 'Quiz Accuracy Chart' });
    expect(chart).not.toBeNull();
  });

  test('Analytics Modal: accessibility and keyboard interaction', async ({ page }) => {
    await setupMockAuth(page);
    await page.goto('http://localhost:5173');
    await waitForAppReady(page);
    await injectMinimumQuizState(page);
    // Open modal
    await expect(page.locator('[data-testid="open-analytics-btn"]').first()).toBeVisible();
    await page.locator('[data-testid="open-analytics-btn"]').first().click();
    const modal = page.getByTestId('analytics-modal');
    await expect(modal).toBeVisible();
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
    await page.locator('[data-testid="open-analytics-btn"]').first().click();
    const modalHandle = await modal.elementHandle();
    if (modalHandle) {
      const snapshot = await page.accessibility.snapshot({ root: modalHandle });
      expect(snapshot).toMatchObject({ role: 'dialog' });
    }
  });

  test('Analytics Modal: loading and error states are accessible', async ({ page }) => {
    await setupMockAuth(page);
    await page.goto('http://localhost:5173');
    await waitForAppReady(page);
    // Simulate loading state
    await page.evaluate(() => {
      window.__E2E_DEBUG_STATE__ = { analyticsLoading: true };
    });
    await page.locator('[data-testid="open-analytics-btn"]').first().click();
    await expect(page.getByText(/loading/i)).toBeVisible();
    // Simulate error state
    await page.evaluate(() => {
      window.__E2E_DEBUG_STATE__ = { analyticsError: 'Network error' };
    });
    await page.reload();
    await page.locator('[data-testid="open-analytics-btn"]').first().click();
    await expect(page.getByText(/network error/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
  });
});
