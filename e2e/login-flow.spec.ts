import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'test1234@gmail.com';
const TEST_PASSWORD = 'test1234';
const EMAIL_SELECTOR = '[data-testid="test-signin-email"]';
const PASSWORD_SELECTOR = '[data-testid="test-signin-password"]';
const SUBMIT_SELECTOR = '[data-testid="test-signin-submit"]';
const SIGNOUT_SELECTOR = 'button[aria-label="Sign out"], button:has-text("Sign Out")';

async function uiSignIn(page: import('@playwright/test').Page) {
  await page.goto('/profile');
  await page.fill(EMAIL_SELECTOR, TEST_EMAIL);
  await page.fill(PASSWORD_SELECTOR, TEST_PASSWORD);
  await page.click(SUBMIT_SELECTOR);
  // Wait for sign-out button to appear as proof of successful login
  await page.waitForSelector(SIGNOUT_SELECTOR, { timeout: 10000 });
}

test.describe('Sign In Flow (UI)', () => {
  test('shows sign-in prompt when not authenticated', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();
    await expect(page.getByText(/guest/i)).toBeVisible();
  });

  test('signs in with test form and shows user profile', async ({ page }) => {
    await uiSignIn(page);
    await page.goto('/profile');
    await page.waitForSelector(SIGNOUT_SELECTOR, { timeout: 10000 });
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible();
    await expect(page.getByText(/guest/i)).not.toBeVisible();
  });

  test('signs out and returns to guest state', async ({ page }) => {
    await uiSignIn(page);
    await page.goto('/profile');
    await page.waitForSelector(SIGNOUT_SELECTOR, { timeout: 10000 });
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();
    await expect(page.getByText(/guest/i)).toBeVisible();
  });
});
