/* global console */
import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'test1234@gmail.com';
const TEST_PASSWORD = 'test1234';
const TEST_SIGNIN_FORM_SELECTOR = '[data-testid="test-signin-form"]';
const EMAIL_SELECTOR = '[data-testid="test-signin-email"]';
const PASSWORD_SELECTOR = '[data-testid="test-signin-password"]';
const SUBMIT_SELECTOR = '[data-testid="test-signin-submit"]';
const PROFILE_SELECTOR = '[data-testid="profile-page"], [data-testid="user-profile"], [data-testid="profile"]';
const SIGN_OUT_BUTTON_ROLE = { name: /sign out/i };

const LOGIN_PATH = '/profile';

// Test assumes /profile is a full page, not a modal

test.describe('Auth Session Persistence', () => {
  test('should persist session after reload', async ({ page }, testInfo) => {
    await page.goto(LOGIN_PATH);

    // Ensure we are using the test sign-in form
    let testSignInForm = await page.$(TEST_SIGNIN_FORM_SELECTOR);
    if (!testSignInForm) {
      // If not present, try to sign out
      const signOutButton = await page.getByRole('button', SIGN_OUT_BUTTON_ROLE).elementHandle().catch(() => null);
      if (signOutButton) {
        await signOutButton.click();
        await page.waitForSelector(TEST_SIGNIN_FORM_SELECTOR, { timeout: 5000 });
      } else {
        throw new Error('Test sign-in form not found and no sign-out button present. Cannot proceed.');
      }
    }

    // Now fill the test sign-in form only
    await page.fill(EMAIL_SELECTOR, TEST_EMAIL);
    await page.fill(PASSWORD_SELECTOR, TEST_PASSWORD);
    await page.click(SUBMIT_SELECTOR);

    // Debug: Take screenshot after login attempt
    await page.screenshot({ path: testInfo.outputPath('after-login.png'), fullPage: true });
    // Debug: Output page content after login
    const pageContent = await page.content();
    console.log('PAGE CONTENT AFTER LOGIN:', pageContent.slice(0, 1000));

    // Debug: Listen for console messages
    page.on('console', msg => {
      console.log('BROWSER CONSOLE:', msg.type(), msg.text());
    });

    // Wait for sign-out button as proof of login, with retries
    let signOutFound = false;
    for (let i = 0; i < 3; i++) {
      try {
        await page.getByRole('button', SIGN_OUT_BUTTON_ROLE).waitFor({ timeout: 5000 });
        signOutFound = true;
        break;
      } catch {
        console.log(`Sign-out button not found, retry ${i + 1}`);
        await page.waitForTimeout(1000);
      }
    }
    expect(signOutFound).toBeTruthy();

    // Reload the page
    await page.reload();
    // Should still be signed in (sign-out button visible)
    await expect(page.getByRole('button', SIGN_OUT_BUTTON_ROLE)).toBeVisible({ timeout: 5000 });
    // Optionally, check profile info is still visible
    const profileVisible = await page.locator(PROFILE_SELECTOR).first().isVisible().catch(() => false);
    expect(profileVisible).toBeTruthy();
  });
});
