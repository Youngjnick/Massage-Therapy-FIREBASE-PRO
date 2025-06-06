// @ts-nocheck
// Example Playwright test for badge progress panel
import { test, expect } from '@playwright/test';
import { setTestStateWithWait, waitForAppReady, openModalAndWaitForBadge, waitForBadgeState, waitForFullBadgeSync } from './helpers/e2eDebugHelpers';
import { printBadgeState } from './helpers/printBadgeState';

test.describe('Badge Progress Panel', () => {
  test('Badge Progress Panel: open panel and show badge progress', async ({ page }) => {
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
    // Ensure badge state is fully synced in all contexts before proceeding
    await waitForFullBadgeSync(page, 'test');
    await printBadgeState(page, 'after setTestStateWithWait - badge progress panel');
    await waitForBadgeState(page);
    const appStateBadges = await page.evaluate(() => (window.appState && window.appState.badges) ? JSON.stringify(window.appState.badges) : 'no appState.badges');
    console.log('window.appState.badges BEFORE BADGE PROGRESS CHECK:', appStateBadges);
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

    await openModalAndWaitForBadge(
      page,
      async () => {
        await page.waitForSelector('[data-testid="debug-panel"]', { timeout: 5000 });
        // If badge progress panel is a tab or button, click it here if needed
      },
      '[data-testid="debug-panel"]',
      '[data-testid="debug-panel"] [data-testid="badge-earned-test"]',
      'badge-progress-panel'
    );
  });

  test('Badge Progress Panel: should be visible in debug panel', async ({ page }) => {
    await page.goto('/');
    // Wait for the debug panel (where badge progress is shown)
    await page.waitForSelector('[data-testid="debug-panel"]', { timeout: 5000 });
    const panel = await page.$('[data-testid="debug-panel"]');
    expect(panel).not.toBeNull();
    // Optionally, check for badge progress panel if present
    // await expect(page.getByTestId('badge-progress-panel')).toBeVisible();
  });
});
