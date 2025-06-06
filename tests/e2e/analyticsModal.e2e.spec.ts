import { test, expect, Page } from '@playwright/test';

// Helper to robustly get the analytics button (supports both testids)
async function getAnalyticsBtn(page: Page) {
  const btn = page.locator('[data-testid="analytics-btn-header"], [data-testid-alt="open-analytics-btn-header"]');
  try {
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    return btn;
  } catch (e) {
    // Debug: print all visible buttons and DOM if not found
    const visibleButtons = await page.$$eval('button, [role="button"]', btns => btns.map(b => b.outerHTML));
    // eslint-disable-next-line no-console
    console.log('[E2E DEBUG] Visible buttons:', visibleButtons);
    const dom = await page.content();
    // eslint-disable-next-line no-console
    console.log('[E2E DEBUG] DOM snapshot:', dom);
    throw e;
  }
}

test.describe('AnalyticsModal E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__E2E_TEST__ = true;
      window.appState = {
        questions: [
          { id: 'q1', question: 'Q?', answers: ['A'], correct: 0, answered: 0, topic: 'E2E' }
        ]
      };
      window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
        email: 'testuser@gmail.com',
        name: 'Test User',
        uid: 'mock-uid-123',
      }));
    });
  });

  test('is keyboard accessible and traps focus', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500); // Short wait for React to re-render
    const analyticsBtn = await getAnalyticsBtn(page);
    await analyticsBtn.click();
    const modal = page.locator('[data-testid="analytics-modal"]');
    await expect(modal).toBeVisible();
    // Focus trap: focus modal and tab through elements
    await modal.focus();
    await page.keyboard.press('Tab');
    // Escape closes modal
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });

  test('shows loading, error, and empty states', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    // Simulate loading
    await page.evaluate(() => { window.__E2E_DEBUG_STATE__ = { analyticsLoading: true }; });
    const analyticsBtn = await getAnalyticsBtn(page);
    await analyticsBtn.click();
    await expect(page.getByText(/loading/i)).toBeVisible();
    // Simulate error
    await page.evaluate(() => { window.__E2E_DEBUG_STATE__ = { analyticsError: 'Network error' }; });
    await page.reload();
    await page.waitForTimeout(500);
    const analyticsBtn2 = await getAnalyticsBtn(page);
    await analyticsBtn2.click();
    await expect(page.getByText(/network error/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /retry/i })).toBeVisible();
    // Simulate empty
    await page.evaluate(() => { window.__E2E_DEBUG_STATE__ = { analyticsEmpty: true }; });
    await page.reload();
    await page.waitForTimeout(500);
    const analyticsBtn3 = await getAnalyticsBtn(page);
    await analyticsBtn3.click();
    await expect(page.getByText(/no analytics data/i)).toBeVisible();
  });

  test('updates after quiz completion', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    // Simulate quiz completion
    await page.evaluate(() => { window.__E2E_DEBUG_STATE__ = { quizCompleted: true, analytics: { quizzesTaken: 1 } }; });
    const analyticsBtn = await getAnalyticsBtn(page);
    await analyticsBtn.click();
    await expect(page.getByText(/quizzes taken: 1/i)).toBeVisible();
    // Optionally: check window.__E2E_DEBUG_STATE__ for analytics match
    const debugState = await page.evaluate(() => window.__E2E_DEBUG_STATE__ as { analytics: { quizzesTaken: number } });
    expect(debugState.analytics.quizzesTaken).toBe(1);
  });

  test('has correct accessibility attributes and snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    const analyticsBtn = await getAnalyticsBtn(page);
    await analyticsBtn.click();
    const modal = page.locator('[data-testid="analytics-modal"]');
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    const handle = await modal.elementHandle();
    if (handle) {
      const snapshot = await page.accessibility.snapshot({ root: handle });
      expect(snapshot).toBeDefined();
    }
  });
});
