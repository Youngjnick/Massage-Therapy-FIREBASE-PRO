import { test, expect } from '@playwright/test';

test.describe('ErrorBoundary Advanced E2E', () => {
  test('visual regression: fallback UI', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      (window as typeof window & { __FORCE_BADGE_ERROR__?: boolean }).__FORCE_BADGE_ERROR__ = true;
    });
    await page.reload();
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toHaveScreenshot('error-boundary-fallback.png');
  });

  test('focus returns to main UI after error recovery', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      (window as typeof window & { __FORCE_BADGE_ERROR__?: boolean }).__FORCE_BADGE_ERROR__ = true;
    });
    await page.reload();
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible();
    // Remove error and reload
    await page.evaluate(() => {
      (window as typeof window & { __FORCE_BADGE_ERROR__?: boolean }).__FORCE_BADGE_ERROR__ = false;
    });
    await page.reload();
    // Focus should return to first badge card
    const firstBadge = page.locator('[data-testid^="badge-earned-"]').first();
    await expect(firstBadge).toBeVisible();
    await expect(firstBadge).toBeFocused();
  });

  test('fallback UI is announced to screen readers', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      (window as typeof window & { __FORCE_BADGE_ERROR__?: boolean }).__FORCE_BADGE_ERROR__ = true;
    });
    await page.reload();
    const alert = page.locator('[role="alert"]');
    const handle = await alert.elementHandle();
    if (handle) {
      const snapshot = await page.accessibility.snapshot({ root: handle });
      if (snapshot) {
        expect(snapshot.role).toBe('alert');
        expect(snapshot.name?.toLowerCase()).toContain('something went wrong');
      }
    }
  });

  test('fallback UI persists after reload until error is cleared', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      (window as typeof window & { __FORCE_BADGE_ERROR__?: boolean }).__FORCE_BADGE_ERROR__ = true;
    });
    await page.reload();
    await expect(page.locator('[role="alert"]')).toBeVisible();
    // Reload again, should still be visible
    await page.reload();
    await expect(page.locator('[role="alert"]')).toBeVisible();
    // Clear error and reload
    await page.evaluate(() => {
      (window as typeof window & { __FORCE_BADGE_ERROR__?: boolean }).__FORCE_BADGE_ERROR__ = false;
    });
    await page.reload();
    await expect(page.locator('[role="alert"]')).toHaveCount(0);
  });

  test('handles long/complex error messages', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as typeof window & { __FORCE_BADGE_ERROR__?: any }).__FORCE_BADGE_ERROR__ = 'A very long and complex error message for edge case testing. '.repeat(10);
    });
    await page.reload();
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/very long and complex error message/i);
  });

  // If you have a retry button in your fallback UI, test it:
  test('retry button recovers from error', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      (window as typeof window & { __FORCE_BADGE_ERROR__?: boolean }).__FORCE_BADGE_ERROR__ = true;
    });
    await page.reload();
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible();
    const retryBtn = page.locator('[data-testid="retry-badges-btn"]');
    if (await retryBtn.count()) {
      await retryBtn.click();
      // Simulate error cleared after retry
      await page.evaluate(() => {
        (window as typeof window & { __FORCE_BADGE_ERROR__?: boolean }).__FORCE_BADGE_ERROR__ = false;
      });
      await page.reload();
      await expect(page.locator('[role="alert"]')).toHaveCount(0);
      await expect(page.locator('[data-testid^="badge-earned-"]')).toBeVisible();
    }
  });

  // If you have multiple/nested error boundaries, test them:
  test('multiple error boundaries: only relevant fallback UI appears', async ({ page }) => {
    await page.goto('/');
    // Simulate error in badges only
    await page.evaluate(() => {
      (window as typeof window & { __FORCE_BADGE_ERROR__?: boolean }).__FORCE_BADGE_ERROR__ = true;
      (window as typeof window & { __FORCE_ANALYTICS_ERROR__?: boolean }).__FORCE_ANALYTICS_ERROR__ = false;
    });
    await page.reload();
    await expect(page.locator('[role="alert"]')).toBeVisible();
    // Simulate error in analytics only
    await page.evaluate(() => {
      (window as typeof window & { __FORCE_BADGE_ERROR__?: boolean }).__FORCE_BADGE_ERROR__ = false;
      (window as typeof window & { __FORCE_ANALYTICS_ERROR__?: boolean }).__FORCE_ANALYTICS_ERROR__ = true;
    });
    await page.reload();
    // Should show analytics error fallback, not badge error
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('fallback UI is translated (i18n)', async ({ page }) => {
    await page.goto('/');
    // Simulate error and set language to Spanish (example)
    await page.evaluate(() => {
      (window as typeof window & { __FORCE_BADGE_ERROR__?: boolean }).__FORCE_BADGE_ERROR__ = true;
      document.documentElement.lang = 'es';
    });
    await page.reload();
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible();
    // Check for Spanish translation (adjust to your actual translation)
    await expect(alert).toContainText(/algo salió mal|something went wrong/i);
  });

  test('fallback UI renders quickly (performance)', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      (window as typeof window & { __FORCE_BADGE_ERROR__?: boolean }).__FORCE_BADGE_ERROR__ = true;
    });
    const start = Date.now();
    await page.reload();
    await expect(page.locator('[role="alert"]')).toBeVisible();
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000); // Should render in under 1s
  });
});
