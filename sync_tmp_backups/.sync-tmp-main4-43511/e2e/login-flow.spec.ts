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

test.describe('Sign In Flow (UI)', () => {
  test('shows sign-in prompt when not authenticated', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();
    await expect(page.getByText(/guest/i)).toBeVisible();
  });

  test('signs in with test form and shows user profile', async ({ page }) => {
    const user = await getTestUser(0);
    await uiSignIn(page, { email: user.email, password: user.password });
    await page.goto('/profile');
    await page.waitForSelector('button[aria-label="Sign out"], button:has-text("Sign Out")', { timeout: 10000 });
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
    await expect(page.getByText(/guest/i)).not.toBeVisible();
  });

  test('signs out and returns to guest state', async ({ page }) => {
    const user = await getTestUser(0);
    await uiSignIn(page, { email: user.email, password: user.password });
    await page.goto('/profile');
    await page.waitForSelector('button[aria-label="Sign out"], button:has-text("Sign Out")', { timeout: 10000 });
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();
    await expect(page.getByText(/guest/i)).toBeVisible();
  });
});
