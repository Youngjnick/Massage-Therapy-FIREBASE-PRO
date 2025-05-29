// Playwright E2E: Quiz flow and analytics update
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

test.describe('Quiz Flow', () => {
  test('User can start quiz, answer questions, and analytics update', async ({ page }) => {
    await mockAuth(page);
    await page.goto('/');

    // Wait for topic and length dropdowns
    await page.waitForSelector('.control[data-topic]');
    await page.waitForSelector('.control[data-quiz-length]');

    // Select first topic and quiz length 5
    await page.selectOption('.control[data-topic]', { index: 1 });
    await page.selectOption('.control[data-quiz-length]', { value: '5' });

    // Start quiz
    await page.click('.start-btn');
    await page.waitForSelector('.quiz-card');

    // Answer all questions
    for (let i = 0; i < 5; i++) {
      await page.waitForSelector('.answer-btn');
      const btns = await page.$$('.answer-btn');
      await btns[0].click(); // Always pick first answer
      await page.waitForSelector('.next-btn');
      await page.click('.next-btn');
    }

    // Quiz complete UI
    await page.waitForSelector('.quiz-card-complete');

    // Open analytics modal
    await page.getByTestId('analytics-btn').click();
    await expect(page.getByTestId('analytics-modal')).toBeVisible();
    // Check that accuracy chart and stats are present
    await expect(page.getByTestId('accuracy-chart')).toBeVisible();
    await expect(page.getByTestId('history-chart')).toBeVisible();
    await expect(page.getByTestId('mastery-chart')).toBeVisible();
    // Check that stats reflect 5 questions
    const statsText = await page.getByTestId('analytics-modal').innerText();
    expect(statsText).toContain('Total Questions: 5');
  });
});
