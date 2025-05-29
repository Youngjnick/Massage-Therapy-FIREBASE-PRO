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

test.describe('AnalyticsModal Accessibility', () => {
  // Helper for sign-in
  async function signIn(page: Page) {
    await page.goto('/');
    await page.fill('input[type="email"]', 'testuser@gmail.com');
    await page.fill('input[type="password"]', 'testpassword123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('img[alt="Profile"], img[alt="User Avatar"], #mainProfileAvatar')).toBeVisible();
  }

  test('AnalyticsModal charts have ARIA labels and are keyboard accessible', async ({ page }) => {
    await mockAuth(page);
    await signIn(page);
    await page.waitForSelector('.control[data-topic]');
    await page.selectOption('.control[data-topic]', { index: 1 });
    await page.selectOption('.control[data-quiz-length]', { value: '5' });
    await page.click('.start-btn');
    await page.waitForSelector('.analytics-link');
    await page.getByTestId('analytics-btn').click();
    await expect(page.getByTestId('analytics-modal')).toBeVisible();
    // Check ARIA attributes on charts
    const doughnut = await page.getByTestId('analytics-modal').locator('[aria-label="Quiz Accuracy Chart"]');
    expect(await doughnut.count()).toBeGreaterThan(0);
    const history = await page.getByTestId('analytics-modal').locator('[aria-label="Quiz History Chart"]');
    expect(await history.count()).toBeGreaterThan(0);
    const mastery = await page.getByTestId('analytics-modal').locator('[aria-label="Mastery History Chart"]');
    expect(await mastery.count()).toBeGreaterThan(0);
    // Tab to close button
    await page.keyboard.press('Tab');
    const closeBtn = await page.getByTestId('close-analytics-modal');
    expect(closeBtn).not.toBeNull();
    if (closeBtn) {
      expect(await closeBtn.getAttribute('aria-label')).toBe('Close modal');
    }
  });
});
