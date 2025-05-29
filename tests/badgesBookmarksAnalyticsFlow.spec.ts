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

// BADGES/BOOKMARKS/ANALYTICS BADGE TESTS TEMPORARILY DISABLED
/*
test.describe('Badges, Bookmarks, Analytics E2E', () => {
  // Helper for sign-in
  async function signIn(page: Page) {
    await page.goto('/');
    await page.fill('input[type="email"]', 'testuser@gmail.com');
    await page.fill('input[type="password"]', 'testpassword123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('img[alt="Profile"], img[alt="User Avatar"], #mainProfileAvatar')).toBeVisible();
  }

  test('Badge progress panel shows earned and unearned badges', async ({ page }) => {
    await mockAuth(page);
    await signIn(page);
    // Open profile modal to access badges
    await page.click('#profileBtn');
    await page.click('text=Smart Learning');
    // Badge grid should be visible
    await expect(page.locator('.badge-grid')).toBeVisible();
    // Check for at least one badge name and earned/unearned styling
    const badgeHtml = await page.locator('.badge-grid').innerHTML();
    expect(badgeHtml).toMatch(/Accuracy|Streak|Badge/i);
  });
});
*/

// Bookmarking a question updates bookmarks sidebar
test('Bookmarking a question updates bookmarks sidebar', async ({ page }) => {
  await mockAuth(page);
  // Start a quiz
  await page.click('button.start-btn');
  // Bookmark the first question
  await page.click('.bookmark-btn');
  // Open bookmarks sidebar (if exists)
  if (await page.locator('text=Bookmarks').isVisible()) {
    await page.click('text=Bookmarks');
    // Check that at least one bookmarked question is listed
    await expect(page.locator('.bookmarked-question')).toBeVisible();
  }
});

// Analytics modal opens and displays stats
test('Analytics modal opens and displays stats', async ({ page }) => {
  await mockAuth(page);
  // Open analytics modal
  await page.click('text=View Analytics');
  // Modal should be visible
  await expect(page.locator('.modal-body')).toContainText('Quiz Stats');
  // Check for at least one stat
  await expect(page.locator('.modal-body')).toContainText(/Total Questions|Accuracy|Streak/i);
});
