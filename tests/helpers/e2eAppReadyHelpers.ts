// filepath: tests/helpers/e2eAppReadyHelpers.ts
import { Page } from "@playwright/test";

/**
 * Waits for the app to be ready for E2E tests (React root and E2E hook attached)
 */
export async function waitForAppReady(page: Page) {
  await page.waitForSelector("#react-root", {
    state: "attached",
    timeout: 30000,
  });
  await page.waitForFunction(() => !!window.__E2E_HOOK_ATTACHED, null, {
    timeout: 30000,
  });
}
