// playwright/helpers/printBadgeState.ts
// Utility to print all badge-related state from the browser for E2E debugging
import { Page } from "@playwright/test";

/**
 * Prints all badge-related state from the browser console for E2E debugging.
 * Call this after any badge/analytics state injection or test step.
 * @param page Playwright Page
 * @param label Optional label for grouping logs
 */
export async function printBadgeState(page: Page, label = "") {
  await page.evaluate((label) => {
    // Print all badge state for debug
    // eslint-disable-next-line no-console
    console.log(
      `%c[E2E][BADGE STATE] ${label}\nwindow.appState.badges:`,
      "color: #0074D9",
      JSON.stringify(window.appState && window.appState.badges),
    );
    // eslint-disable-next-line no-console
    console.log(
      `%c[E2E][BADGE STATE] ${label}\nwindow.badges:`,
      "color: #2ECC40",
      JSON.stringify(window.badges),
    );
    // eslint-disable-next-line no-console
    console.log(
      `%c[E2E][BADGE STATE] ${label}\nwindow.earnedBadges:`,
      "color: #FF4136",
      JSON.stringify(window.earnedBadges),
    );
  }, label);
}

declare global {
  interface Window {
    earnedBadges?: unknown; // Add this line to fix TS error
  }
}
