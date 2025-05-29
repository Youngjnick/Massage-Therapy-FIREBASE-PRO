// Example Playwright test for analytics modal
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

test.describe('Analytics Modal', () => {
  // Helper for sign-in
  async function signIn(page: Page) {
    await page.goto('/');
    await page.fill('input[type="email"]', 'testuser@gmail.com');
    await page.fill('input[type="password"]', 'testpassword123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('img[alt="Profile"], img[alt="User Avatar"], #mainProfileAvatar')).toBeVisible();
  }

  test('Analytics Modal: open modal and display chart', async ({ page }) => {
    await mockAuth(page);
    await signIn(page);

    // Inject E2E flag and questions before any app code runs
    await page.addInitScript(() => {
      // @ts-ignore
      window.__E2E_TEST__ = true;
      localStorage.setItem('questions', JSON.stringify([
        {
          id: 'test-q1',
          question: 'What is the capital of France?',
          answers: ['Paris', 'London', 'Berlin', 'Rome'],
          correct: 0,
          topic: 'geography',
          unit: 'europe'
        }
      ]));
    });
    await page.goto('/');

    // Wait for the topic dropdown to be populated with real options
    await page.waitForFunction(() => {
      const sel = document.querySelector('.control[data-topic]');
      return sel && (sel instanceof HTMLSelectElement) && sel.options.length > 1;
    }, { timeout: 10000 });

    // Select the first real topic (skip placeholder)
    await page.selectOption('.control[data-topic]', { index: 1 });
    await page.selectOption('.control[data-quiz-length]', { value: '5' });

    // Start the quiz
    await page.click('.start-btn');

    // Wait for the first question to load
    await page.waitForSelector('.question-text, .question-container', { timeout: 5000 });

    // Wait for the analytics button
    await expect(page.getByTestId('analytics-btn')).toBeVisible();
    await page.getByTestId('analytics-btn').click();

    // Wait for the analytics modal
    await expect(page.getByTestId('analytics-modal')).toBeVisible();

    // Wait for the chart canvas
    await expect(page.getByTestId('analytics-modal').locator('canvas')).toBeVisible();

    const modal = await page.getByTestId('analytics-modal');
    expect(modal).not.toBeNull();
    const chart = await page.getByTestId('analytics-modal').locator('canvas');
    expect(chart).not.toBeNull();
  });
});
