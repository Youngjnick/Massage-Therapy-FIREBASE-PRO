import { Page } from '@playwright/test';

export async function uiSignIn(
  page: Page,
  {
    email = 'test1234@gmail.com',
    password = 'test1234',
    profilePath = '/profile',
  }: { email?: string; password?: string; profilePath?: string } = {}
) {
  const TEST_SIGNIN_FORM_SELECTOR = '[data-testid="test-signin-form"]';
  const EMAIL_SELECTOR = '[data-testid="test-signin-email"]';
  const PASSWORD_SELECTOR = '[data-testid="test-signin-password"]';
  const SUBMIT_SELECTOR = '[data-testid="test-signin-submit"]';
  const SIGNOUT_SELECTOR = 'button[aria-label="Sign out"], button:has-text("Sign Out")';

  // Try /profile first, then / if not found
  let testSignInForm = null;
  let triedLanding = false;
  for (const pathToTry of [profilePath, '/']) {
    await page.goto(pathToTry);
    // Debug: screenshot before sign-in
    await page.screenshot({ path: `test-signin-before-${pathToTry.replace('/', '') || 'root'}.png`, fullPage: true });
    for (let i = 0; i < 20; i++) {
      testSignInForm = await page.$(TEST_SIGNIN_FORM_SELECTOR);
      if (testSignInForm) break;
      await page.waitForTimeout(500);
    }
    if (testSignInForm) break;
    triedLanding = true;
  }
  if (!testSignInForm) {
    // If not present, try to sign out
    const signOutButton = await page.getByRole('button', { name: /sign out/i }).elementHandle().catch(() => null);
    if (signOutButton) {
      await signOutButton.click();
      await page.waitForSelector(TEST_SIGNIN_FORM_SELECTOR, { timeout: 5000 });
    } else {
      await page.screenshot({ path: 'test-signin-missing.png', fullPage: true });
      throw new Error('Test sign-in form not found and no sign-out button present. Cannot proceed.');
    }
  }
  // Wait for form to be visible and enabled
  await page.waitForSelector(EMAIL_SELECTOR, { timeout: 5000, state: 'visible' });
  await page.waitForSelector(PASSWORD_SELECTOR, { timeout: 5000, state: 'visible' });
  await page.waitForSelector(SUBMIT_SELECTOR, { timeout: 5000, state: 'visible' });
  await page.screenshot({ path: 'test-signin-form-visible.png', fullPage: true });
  await page.fill(EMAIL_SELECTOR, email);
  await page.fill(PASSWORD_SELECTOR, password);
  await page.screenshot({ path: 'test-signin-filled.png', fullPage: true });
  await page.click(SUBMIT_SELECTOR);
  await page.waitForSelector(SIGNOUT_SELECTOR, { timeout: 10000 });
  await page.screenshot({ path: 'test-signin-after.png', fullPage: true });
}
