/* global console */


import { test, expect } from '@playwright/test';
import { uiSignIn } from './helpers/uiSignIn';

import { execSync } from 'child_process';


const TEST_EMAIL = 'test1234@gmail.com';
const TEST_PASSWORD = 'test1234';
const PROFILE_SELECTOR = '[data-testid="profile-page"], [data-testid="user-profile"], [data-testid="profile"]';
const SIGN_OUT_BUTTON_ROLE = { name: /sign out/i };
const LOGIN_PATH = '/profile';

// Test assumes /profile is a full page, not a modal


test.describe('Auth Session Persistence', () => {
  test.beforeAll(async () => {
    // Reset Auth emulator before running the test
    try {
      execSync('node ./scripts/resetAuthEmulator.ts', {
        stdio: 'inherit',
        env: { ...process.env },
      });
    } catch (e) {
      console.error('Failed to reset Auth emulator:', e);
    }
  });

  test('should persist session after reload', async ({ page }, testInfo) => {

    // Ensure clean state before login
    await page.goto(LOGIN_PATH);
    await page.evaluate(() => {
      window.localStorage.clear();
    });
    await page.context().clearCookies();
    // Use shared sign-in helper for robust login
    await uiSignIn(page, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    // Debug: Listen for console messages
    page.on('console', msg => {
      console.log('BROWSER CONSOLE:', msg.type(), msg.text());
    });

    // Wait for sign-out button as proof of login
    await expect(page.getByRole('button', SIGN_OUT_BUTTON_ROLE)).toBeVisible({ timeout: 5000 });

    // Debug: Log auth user in localStorage before reload
    const authUserKey = `firebase:authUser:massage-therapy-smart-st-c7f8f:[DEFAULT]`;
    const userBefore = await page.evaluate(key => window.localStorage.getItem(key), authUserKey);
    console.log('Auth user in localStorage BEFORE reload:', userBefore);

    // Reload the page
    await page.reload();

    // Debug: Log auth user in localStorage after reload
    const userAfter = await page.evaluate(key => window.localStorage.getItem(key), authUserKey);
    console.log('Auth user in localStorage AFTER reload:', userAfter);

    // Should still be signed in (sign-out button visible)
    await expect(page.getByRole('button', SIGN_OUT_BUTTON_ROLE)).toBeVisible({ timeout: 5000 });
    // Optionally, check profile info is still visible
    const profileVisible = await page.locator(PROFILE_SELECTOR).first().isVisible().catch(() => false);
    expect(profileVisible).toBeTruthy();
  });
});
