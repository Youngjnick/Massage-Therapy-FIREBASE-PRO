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

test('auth smoke: can sign in and see user info', async ({ page }) => {
  await uiSignIn(page);
  await page.goto('/profile');
  // Assert the sign-out button is visible as proof of sign-in
  await expect(page.locator(SIGNOUT_SELECTOR)).toBeVisible({ timeout: 5000 });
});
