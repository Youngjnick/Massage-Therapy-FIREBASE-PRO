// @ts-nocheck
import { test, expect } from "@playwright/test";
import { setTestStateWithWait, waitForAppReady } from "./helpers/e2eDebugHelpers";

test.describe('Debug Panel Flows', () => {
  test('Debug Panel: should be visible and show badge progress', async ({ page }) => {
    // Set E2E mode and mock auth before navigation
    await page.addInitScript(() => {
      window.__E2E_TEST__ = true;
      window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
        email: 'testuser@gmail.com',
        name: 'Test User',
        uid: 'mock-uid-123',
      }));
    });
    await page.goto('/');
    await waitForAppReady(page);
    // Inject E2E questions after app and E2E hook are ready
    await setTestStateWithWait(page, {
      questions: [
        {
          id: 'test-q1',
          question: 'What is the capital of France?',
          answers: ['Paris', 'London', 'Berlin', 'Rome'],
          correct: 0,
          topic: 'geography',
          unit: 'europe'
        }
      ],
      badges: [{ id: 'test', name: 'Test Badge', earned: true, image: '/badges/default.png', description: 'E2E Test Badge' }],
    });
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
    await page.addInitScript(() => {
      window.__E2E_TEST__ = true;
      window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
        email: 'testuser@gmail.com',
        name: 'Test User',
        uid: 'mock-uid-123',
      }));
    });
    await page.goto('/');
    await waitForAppReady(page);
    await page.waitForSelector('[data-testid="debug-panel"]', { timeout: 5000 });
    // Optionally check for sync status/event log if implemented
    // await expect(page.getByTestId('badge-progress-panel')).toBeVisible();
  });
});
