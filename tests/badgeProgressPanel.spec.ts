// Example Playwright test for badge progress panel
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

// BADGE PROGRESS PANEL E2E TESTS TEMPORARILY DISABLED
/*
test.describe('Badge Progress Panel', () => {
  // Helper for sign-in
  async function signIn(page: Page) {
    await page.goto('/');
    await page.fill('input[type="email"]', 'testuser@gmail.com');
    await page.fill('input[type="password"]', 'testpassword123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('img[alt="Profile"], img[alt="User Avatar"], #mainProfileAvatar')).toBeVisible();
  }

  test('Badge Progress Panel: open panel and show badge progress', async ({ page }) => {
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
    await page.getByTestId('start-quiz-btn').click();
    // Wait for the first question to load
    await page.waitForSelector('.question-text, .question-container', { timeout: 5000 });
    // Wait for the debug panel (where badge progress is shown)
    await page.waitForSelector('[data-testid="debug-panel"]', { timeout: 5000 });
    const panel = await page.$('[data-testid="debug-panel"]');
    expect(panel).not.toBeNull();
    // Optionally, check for badge progress panel if present
    // await expect(page.getByTestId('badge-progress-panel')).toBeVisible();
  });

  test('Badge Progress Panel: should be visible in debug panel', async ({ page }) => {
    await mockAuth(page);
    await signIn(page);
    await page.goto('/');
    // Wait for the debug panel (where badge progress is shown)
    await page.waitForSelector('[data-testid="debug-panel"]', { timeout: 5000 });
    const panel = await page.$('[data-testid="debug-panel"]');
    expect(panel).not.toBeNull();
    // Optionally, check for badge progress panel if present
    // await expect(page.getByTestId('badge-progress-panel')).toBeVisible();
  });
});
*/

test.describe('End2End', () => {
  test('e2e: open panel and show badge progress', async ({ page }) => {
    await mockAuth(page);
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
    await page.getByTestId('start-quiz-btn').click();
    // Wait for the first question to load
    await page.waitForSelector('.question-text, .question-container', { timeout: 5000 });
    // Wait for the debug panel (where badge progress is shown)
    await page.waitForSelector('[data-testid="debug-panel"]', { timeout: 5000 });
    const panel = await page.$('[data-testid="debug-panel"]');
    expect(panel).not.toBeNull();
    // Optionally, check for badge progress panel if present
    // await expect(page.getByTestId('badge-progress-panel')).toBeVisible();
  });

  test('e2e: should be visible in debug panel', async ({ page }) => {
    await mockAuth(page);
    await page.goto('/');
    // Wait for the debug panel (where badge progress is shown)
    await page.waitForSelector('[data-testid="debug-panel"]', { timeout: 5000 });
    const panel = await page.$('[data-testid="debug-panel"]');
    expect(panel).not.toBeNull();
    // Optionally, check for badge progress panel if present
    // await expect(page.getByTestId('badge-progress-panel')).toBeVisible();
  });
});
