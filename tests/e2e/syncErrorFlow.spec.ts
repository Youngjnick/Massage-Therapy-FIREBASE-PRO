// Playwright E2E: Sync error simulation and UI feedback
import { test, expect } from '@playwright/test';
// import fs from 'fs';

test.describe('Sync Error Flow', () => {
  test('Sync Error Flow: simulate sync error and show error UI', async ({ page }) => {
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

    // Wait for the sync error trigger (if present in debug panel)
    await page.waitForSelector('.simulate-sync-error-btn, #debug-panel', { timeout: 5000 });

    // Optionally, click the sync error button if present
    await page.evaluate(() => {
      const btn = document.querySelector('.simulate-sync-error-btn');
      if (btn) (btn as HTMLElement).click();
    });

    // Wait for the error UI
    await page.waitForSelector('.sync-error-ui', { timeout: 5000 });

    const errorUI = await page.$('.sync-error-ui');
    expect(errorUI).not.toBeNull();
  });
});
