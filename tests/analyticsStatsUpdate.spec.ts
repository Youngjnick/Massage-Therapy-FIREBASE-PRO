// Playwright E2E: Analytics stats show and update after each answer
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

test.describe('Analytics Stats Update', () => {
  // Helper for sign-in
  async function signIn(page: Page) {
    await page.goto('/');
    await expect(page.locator('img[alt="Profile"], img[alt="User Avatar"], #mainProfileAvatar')).toBeVisible();
  }

  test('Stats are visible and update after each answer', async ({ page }) => {
    await mockAuth(page);
    await signIn(page);
    await page.waitForSelector('.control[data-topic]');
    await page.selectOption('.control[data-topic]', { index: 1 });
    await page.selectOption('.control[data-quiz-length]', { value: '5' });
    await page.click('.start-btn');
    await page.waitForSelector('.quiz-card');

    // Answer first question
    await page.waitForSelector('.answer-btn');
    await page.click('.answer-btn');
    await page.waitForSelector('.next-btn');
    await page.click('.next-btn');

    // Open analytics modal
    await page.getByTestId('analytics-btn').click();
    await expect(page.getByTestId('analytics-modal')).toBeVisible();
    // Check stats for 1 answered question
    const statsText1 = await page.getByTestId('analytics-modal').innerText();
    expect(statsText1).toContain('Total Questions: 5');
    expect(statsText1).toMatch(/Correct Answers: [01]/);
    expect(statsText1).toMatch(/Incorrect Answers: [0-5]/);
    await expect(page.getByTestId('accuracy-chart')).toBeVisible();
    await expect(page.getByTestId('history-chart')).toBeVisible();
    await expect(page.getByTestId('mastery-chart')).toBeVisible();
    await page.getByTestId('close-analytics-modal').click();

    // Answer second question
    await page.click('.answer-btn');
    await page.waitForSelector('.next-btn');
    await page.click('.next-btn');
    // Open analytics modal again
    await page.getByTestId('analytics-btn').click();
    await expect(page.getByTestId('analytics-modal')).toBeVisible();
    // Check stats for 2 answered questions
    const statsText2 = await page.getByTestId('analytics-modal').innerText();
    expect(statsText2).toContain('Total Questions: 5');
    expect(statsText2).toMatch(/Correct Answers: [012]/);
    expect(statsText2).toMatch(/Incorrect Answers: [0-5]/);
    await expect(page.getByTestId('accuracy-chart')).toBeVisible();
    await expect(page.getByTestId('history-chart')).toBeVisible();
    await expect(page.getByTestId('mastery-chart')).toBeVisible();
  });
});
