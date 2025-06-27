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

import { test, expect } from '@playwright/test';

test.describe('Accessibility: ARIA roles and labels', () => {
  test('Main navigation and buttons have correct ARIA roles and labels', async ({ page }) => {
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
});
