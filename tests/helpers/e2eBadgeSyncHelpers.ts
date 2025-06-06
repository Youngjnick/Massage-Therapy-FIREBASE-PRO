// filepath: tests/helpers/e2eBadgeSyncHelpers.ts

/**
 * E2E badge sync helpers for Playwright tests.
 * Use syncBadgesE2E(page) to robustly flush badge state after any badge state injection.
 *
 * @param page Playwright Page object
 * @returns Promise<void> Resolves when badge state is fully flushed and UI is updated.
 */
export async function syncBadgesE2E(
  page: import("@playwright/test").Page,
): Promise<void> {
  // Robustly sync badge state in E2E after state injection
  await page.evaluate(() => {
    if (typeof window.__SYNC_BADGES__ === "function") {
      return window.__SYNC_BADGES__();
    }
  });
  // Ensure all microtasks and UI updates are flushed
  await page.waitForTimeout(0);
}
