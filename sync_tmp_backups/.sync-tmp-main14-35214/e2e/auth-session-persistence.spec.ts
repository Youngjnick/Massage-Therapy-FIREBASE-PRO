import { test, expect } from '@playwright/test';
import { uiSignIn } from './helpers/uiSignIn';
import fs from 'fs/promises';
import path from 'path';
import './helpers/playwright-coverage';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
async function getTestUser(index = 0) {
  const usersPath = path.resolve(__dirname, 'test-users.json');
  const usersRaw = await fs.readFile(usersPath, 'utf-8');
  const users = JSON.parse(usersRaw);
  return users[index];
}

const LOGIN_PATH = '/profile';

// NOTE: This test file now assumes the emulator is reset and the test user is created globally.
// Remove per-file reset and user creation for speed and reliability.
test.describe('Auth Session Persistence', () => {
  test('should persist session after reload', async ({ page }) => {
    // Ensure clean state before login
    await page.goto(LOGIN_PATH);
    await page.evaluate(() => {
      window.localStorage.clear();
    });
    await page.context().clearCookies();

    // Use robust shared sign-in helper with dynamic test user
    const user = await getTestUser(0);
    await uiSignIn(page, { email: user.email, password: user.password });

    // Wait for sign-out button as proof of login (same as other tests)
    await expect(page.locator('button[aria-label="Sign out"], button:has-text("Sign Out")')).toBeVisible({ timeout: 10000 });

    // Debug: screenshot after login
    await page.screenshot({ path: 'test-results/screenshots/test-signin-after.png', fullPage: true });

    // Reload the page
    await page.reload();

    // Should still be signed in (sign-out button visible)
    await expect(page.locator('button[aria-label="Sign out"], button:has-text("Sign Out")')).toBeVisible({ timeout: 10000 });
  });
});
