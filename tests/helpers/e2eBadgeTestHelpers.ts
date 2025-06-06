// filepath: tests/helpers/e2eBadgeTestHelpers.ts
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { expect, Page } from "@playwright/test";

/**
 * Closes any open modals (analytics, profile, etc.)
 */
export async function closeModalsIfOpen(page: Page) {
  const analyticsModal = await page.$('[data-testid="analytics-modal"]');
  if (analyticsModal) {
    await page.keyboard.press("Escape");
    await page
      .waitForSelector('[data-testid="analytics-modal"]', {
        state: "hidden",
        timeout: 3000,
      })
      .catch(() => {});
  }
  const profileModal = await page.$('[data-testid="profile-modal"]');
  if (profileModal) {
    await page.keyboard.press("Escape");
    await page
      .waitForSelector('[data-testid="profile-modal"]', {
        state: "hidden",
        timeout: 3000,
      })
      .catch(() => {});
  }
}

/**
 * Prints ErrorBoundary error stack if present
 */
export async function printE2EErrorStack(page: Page) {
  const errorStack = await page
    .locator('[data-testid="e2e-error-stack"]')
    .textContent()
    .catch(() => null);
  if (errorStack) {
    // eslint-disable-next-line no-console
    console.error("[E2E][ErrorBoundary] error stack:", errorStack);
  } else {
    // eslint-disable-next-line no-console
    console.log("[E2E][ErrorBoundary] No error stack found in DOM.");
  }
}
