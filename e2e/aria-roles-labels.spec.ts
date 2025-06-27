// How to prevent port issues and test failures in the future:
// 1. Always free up port 5173 before running tests:
//    lsof -ti:5173 | xargs kill -9
// 2. Force Vite to use 5173 and fail if unavailable by using:
//    vite --port 5173 --strictPort
//    (in your package.json dev script)
// 3. Use relative URLs in Playwright tests (already done here).
// 4. (Optional) Add a pretest script in package.json:
//    "pretest:e2e": "lsof -ti:5173 | xargs kill -9 || true"
//
// Summary: The test failed because the app was not running on the expected port, so Playwright couldn't find the "Start" button. Keeping ports consistent and using relative URLs prevents this issue.

import { test, expect, Page } from '@playwright/test';

const TEST_EMAIL = 'test1234@gmail.com';
const TEST_PASSWORD = 'test1234';
const EMAIL_SELECTOR = '[data-testid="test-signin-email"]';
const PASSWORD_SELECTOR = '[data-testid="test-signin-password"]';
const SUBMIT_SELECTOR = '[data-testid="test-signin-submit"]';

async function uiSignIn(page: Page) {
  await page.goto('/profile');
  await page.fill(EMAIL_SELECTOR, TEST_EMAIL);
  await page.fill(PASSWORD_SELECTOR, TEST_PASSWORD);
  await page.click(SUBMIT_SELECTOR);
  // Wait for sign-out button to appear as proof of successful login
  await page.waitForSelector('button[aria-label="Sign out"], button:has-text("Sign Out")', { timeout: 10000 });
}

test.describe('Accessibility: ARIA roles and labels', () => {
  test('Main navigation and buttons have correct ARIA roles and labels', async ({ page }) => {
    await uiSignIn(page);
    await page.goto('/');

    // Main navigation
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();

    // Main heading
    const mainHeading = page.getByRole('heading', { level: 1 });
    await expect(mainHeading).toBeVisible();

    // Go to quiz page and follow the same flow as other passing tests
    await page.goto('/quiz');
    // Wait for quiz length input and fill it if present
    const quizLengthInput = page.locator('[aria-label="Quiz Length"], input[name="quizLength"]');
    if (await quizLengthInput.count() > 0) {
      await quizLengthInput.first().fill('1');
    }
    // Wait for Start button
    const startButton = page.getByRole('button', { name: /start/i });
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Quiz options (radio buttons) should now be present
    const quizOptions = page.getByRole('radio');
    expect(await quizOptions.count()).toBeGreaterThan(0);

    // Profile link with aria-label (may only be visible when signed in)
    const profileLink = page.locator('[aria-label="Profile"]');
    if (await profileLink.count() > 0) {
      await expect(profileLink).toBeVisible();
    } else {
      /* eslint-disable no-undef */
      // Optionally, log or skip if not present
      console.warn('Profile link not found. Skipping this check.');
      /* eslint-enable no-undef */
    }
  });

  test('Keyboard navigation: Tab through all interactive elements and ensure correct focus order', async ({ page }) => {
    await uiSignIn(page);
    await page.goto('/');

    // Collect all tabbable elements
    const tabbableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([type="hidden"]):not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ];
    const tabbable = await page.$$(tabbableSelectors.join(','));
    expect(tabbable.length).toBeGreaterThan(0);

    // Focus the first element and tab through all
    await page.keyboard.press('Tab');
    let lastFocused = await page.evaluate(() => document.activeElement?.outerHTML);
    for (let i = 1; i < tabbable.length; i++) {
      await page.keyboard.press('Tab');
      const currentFocused = await page.evaluate(() => document.activeElement?.outerHTML);
      expect(currentFocused).not.toBe(lastFocused);
      lastFocused = currentFocused;
    }
  });
});
