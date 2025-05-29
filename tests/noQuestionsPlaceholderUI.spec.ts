import { test, expect, Page } from '@playwright/test';

// Helper to set mock auth before each test
async function mockAuth(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
      email: 'testuser@gmail.com',
      name: 'Test User',
      uid: 'mock-uid-123',
    }));
  });
}

test.describe('No Questions Placeholder UI', () => {
  // Helper for sign-in
  async function signIn(page: Page) {
    await page.goto('/');
    await page.fill('input[type="email"]', 'testuser@gmail.com');
    await page.fill('input[type="password"]', 'testpassword123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('img[alt="Profile"], img[alt="User Avatar"], #mainProfileAvatar')).toBeVisible();
  }

  test('Shows placeholder or empty state if no questions loaded', async ({ page }) => {
    await mockAuth(page);
    await signIn(page);
    await page.evaluate(() => { window.appState.questions = []; window.setupUI(); });
    // Check for any of the possible empty state indicators
    const possibleSelectors = ['.no-questions', '.empty-state', '#questionList'];
    let found = false;
    for (const sel of possibleSelectors) {
      if (await page.locator(sel).count() > 0) {
        const text = await page.locator(sel).textContent();
        if (text && /no questions|empty|add questions/i.test(text)) {
          found = true;
          break;
        }
      }
    }
    expect(found).toBe(true);
  });
});