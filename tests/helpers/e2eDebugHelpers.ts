// playwright/helpers/e2eDebugHelpers.ts
// Playwright helpers for reading and asserting on the E2E debug panel and window.__E2E_DEBUG_STATE__

import { Page, expect } from '@playwright/test';

// Add this at the top of the file to extend the Window interface for __E2E_DEBUG_STATE__
declare global {
  interface Window {
    __E2E_DEBUG_STATE__?: any;
  }
}

/**
 * Reads and parses the visible E2E debug panel JSON from the app.
 * @param page Playwright Page
 */
export async function getE2EDebugPanelState(page: Page) {
  const debugText = await page.locator('[data-testid="e2e-debug-state"]').textContent();
  try {
    return JSON.parse(debugText || '{}');
  } catch (e) {
    throw new Error('Failed to parse e2e-debug-state panel: ' + e + '\nRaw: ' + debugText);
  }
}

/**
 * Reads the global window.__E2E_DEBUG_STATE__ from the browser context.
 * @param page Playwright Page
 */
export async function getWindowE2EDebugState(page: Page) {
  return await page.evaluate(() => window.__E2E_DEBUG_STATE__);
}

/**
 * Asserts that a property exists and is not null in the E2E debug panel state.
 * @param page Playwright Page
 * @param prop Property name (e.g. 'badgesData')
 */
export async function expectDebugPanelPropDefined(page: Page, prop: string) {
  const state = await getE2EDebugPanelState(page);
  expect(state[prop]).toBeDefined();
}

/**
 * Asserts that a property exists and is not null in window.__E2E_DEBUG_STATE__.
 * @param page Playwright Page
 * @param prop Property name (e.g. 'analyticsData')
 */
export async function expectWindowDebugStatePropDefined(page: Page, prop: string) {
  const state = await getWindowE2EDebugState(page);
  expect(state && state[prop]).toBeDefined();
}

/**
 * Asserts that analyticsData exists and is not null in the debug panel state.
 */
export async function expectAnalyticsDataDefined(page: Page) {
  const state = await getE2EDebugPanelState(page);
  expect(state.analyticsData).toBeDefined();
}

/**
 * Asserts that analyticsData exists and is not null in window.__E2E_DEBUG_STATE__.
 */
export async function expectWindowAnalyticsDataDefined(page: Page) {
  const state = await getWindowE2EDebugState(page);
  expect(state && state.analyticsData).toBeDefined();
}

/**
 * Logs the current E2E debug panel state for debugging.
 * @param page Playwright Page
 */
export async function logE2EDebugPanelState(page: Page) {
  const state = await getE2EDebugPanelState(page);
  // eslint-disable-next-line no-console
  console.log('E2E Debug Panel State:', state);
}

/**
 * Logs the current window.__E2E_DEBUG_STATE__ for debugging.
 * @param page Playwright Page
 */
export async function logWindowE2EDebugState(page: Page) {
  const state = await getWindowE2EDebugState(page);
  // eslint-disable-next-line no-console
  console.log('window.__E2E_DEBUG_STATE__:', state);
}

/**
 * Returns a deep clone of the analyticsData from the debug panel state.
 */
export async function getAnalyticsData(page: Page) {
  const state = await getE2EDebugPanelState(page);
  return JSON.parse(JSON.stringify(state.analyticsData));
}

/**
 * Compares analyticsData before and after an action, and asserts that it has changed.
 * @param page Playwright Page
 * @param actionFn async function that performs the action expected to update analytics
 */
export async function expectAnalyticsDataToChange(page: Page, actionFn: () => Promise<void>) {
  const before = await getAnalyticsData(page);
  await actionFn();
  // Wait for UI/state update
  await page.waitForTimeout(200); // adjust as needed for your app
  const after = await getAnalyticsData(page);
  expect(after).not.toEqual(before);
}
