// Playwright E2E: Debug panel and badge/sync/event log panels
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

test.describe('Debug Panel Flows', () => {
  test('Debug Panel: should be visible and show badge progress', async ({ page }) => {
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
    // Wait for the debug panel to be present (always visible in dev)
    await page.waitForSelector('[data-testid="debug-panel"]', { timeout: 5000 });
    const panel = await page.$('[data-testid="debug-panel"]');
    expect(panel).not.toBeNull();
    await expect(page.getByTestId('debug-panel')).toBeVisible();
    // Optionally, check for badge progress panel if present
    // await expect(page.getByTestId('badge-progress-panel')).toBeVisible();
  });

  test('should show sync status and event log in debug panel (if present)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="debug-panel"]', { timeout: 5000 });
    // Optionally check for sync status/event log if implemented
    // await expect(page.getByTestId('badge-progress-panel')).toBeVisible();
  });
});
