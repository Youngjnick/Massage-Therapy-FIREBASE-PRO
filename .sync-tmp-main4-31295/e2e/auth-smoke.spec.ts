
import { test, expect } from '@playwright/test';
import { uiSignIn } from './helpers/uiSignIn';
import fs from 'fs/promises';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
async function getTestUser(index = 0) {
  const usersPath = path.resolve(__dirname, 'test-users.json');
  const usersRaw = await fs.readFile(usersPath, 'utf-8');
  const users = JSON.parse(usersRaw);
  return users[index];
}


test('auth smoke: can sign in and see user info', async ({ page }) => {
  const user = await getTestUser(0);
  await uiSignIn(page, { email: user.email, password: user.password });
  await page.goto('/profile');
  // Assert the sign-out button is visible as proof of sign-in
  await expect(page.locator('button[aria-label="Sign out"], button:has-text("Sign Out")')).toBeVisible({ timeout: 5000 });
});
