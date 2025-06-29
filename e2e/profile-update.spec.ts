/* global process */
import { test, expect, Page } from '@playwright/test';
import { uiSignIn } from './helpers/uiSignIn';

const PROFILE_PATH = '/profile';

const DARK_MODE_TOGGLE = 'input[type="checkbox"][aria-label="Toggle dark mode"]';

// Helper to get the checked state
async function isChecked(page: Page, selector: string): Promise<boolean> {
  const el = await page.locator(selector);
  return await el.isChecked();
}

test.describe('Profile Settings Persistence', () => {
  test('can toggle dark mode and see it persist after reload', async ({ page }, testInfo) => {
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(`[browser][${msg.type()}] ${msg.text()}`);
    });
    await uiSignIn(page, { profilePath: PROFILE_PATH });
    // Toggle dark mode
    const wasChecked = await isChecked(page, DARK_MODE_TOGGLE);
    await testInfo.attach('Dark mode before toggle', { body: String(wasChecked) });
    await page.click(DARK_MODE_TOGGLE);
    // Wait a moment for auto-save
    await page.waitForTimeout(1000);
    // Reload and check toggle persists
    await page.reload();
    const isNowChecked = await isChecked(page, DARK_MODE_TOGGLE);
    await testInfo.attach('Dark mode after reload', { body: String(isNowChecked) });
    // Print browser logs for debugging
    for (const log of logs) {
      process.stdout.write(log + '\n');
    }
    expect(isNowChecked).toBe(!wasChecked);
  });

  // Add more settings tests as needed
});
