// Playwright E2E: Toast notification flow
import { test, expect, Page } from '@playwright/test';
import fs from 'fs';

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

test.describe('Toast Notification Flow', () => {
  test('should show toast when bookmarking and syncing', async ({ page }) => {
    // Set mock authentication
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
    await page.goto('http://localhost:1234');

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

    // Wait for the bookmark button to be enabled
    await page.waitForSelector('.bookmark-btn:not([disabled])', { timeout: 5000 });

    // Bookmark a question
    await page.click('.bookmark-btn');

    // Wait for the toast notification
    await page.waitForSelector('[data-testid="toast"], [data-testid="bookmark-toast"], [data-testid="sync-toast"]', { timeout: 5000 });

    const toast = await page.$('[data-testid="toast"], [data-testid="bookmark-toast"], [data-testid="sync-toast"]');
    expect(toast).not.toBeNull();
  });
});
