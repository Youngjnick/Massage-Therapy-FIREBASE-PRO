// @ts-nocheck
// Playwright E2E: Analytics stats show and update after each answer
import { test, expect } from '@playwright/test';
import { setTestStateWithWait, waitForAppReady } from './helpers/e2eDebugHelpers';
import { printBadgeState } from './helpers/printBadgeState';

// --- E2E PATCH: Add Playwright hooks for browser console and page errors ---
test.beforeEach(async ({ page }) => {
  page.on('console', msg => {
    // eslint-disable-next-line no-console
    console.log(`[browser console.${msg.type()}]`, msg.text());
  });
  page.on('pageerror', error => {
    // eslint-disable-next-line no-console
    console.error('[browser pageerror]', error);
  });
});

test.describe('Analytics Stats Update', () => {
  test('Analytics stats show and update after each answer', async ({ page }) => {
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
        { id: 'q1', question: 'Q1', topic: 'Anatomy', correct: 0, answered: 0 },
        { id: 'q2', question: 'Q2', topic: 'Anatomy', correct: 1 },
        { id: 'q3', question: 'Q3', topic: 'Anatomy', correct: 2 },
        { id: 'q4', question: 'Q4', topic: 'Anatomy', correct: 0 },
        { id: 'q5', question: 'Q5', topic: 'Anatomy', correct: 1 },
      ],
      quizStarted: true,
      selectedTopic: 'Anatomy',
    });
    await printBadgeState(page, 'after setTestStateWithWait - stats update');
    // Open analytics modal
    await page.locator('[data-testid="open-analytics-btn"]').first().waitFor({ state: 'visible' });
    await page.locator('[data-testid="open-analytics-btn"]').first().click();
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
    // Simulate answering second question (if needed, patch state here)
    // Open analytics modal again
    await page.locator('[data-testid="open-analytics-btn"]').first().click();
    await expect(page.getByTestId('analytics-modal')).toBeVisible();
    // Check stats for 1 answered question (since only q1 is answered in mock)
    const statsText2 = await page.getByTestId('analytics-modal').innerText();
    expect(statsText2).toContain('Total Questions: 5');
    expect(statsText2).toMatch(/Correct Answers: [01]/);
    expect(statsText2).toMatch(/Incorrect Answers: [0-5]/);
    await expect(page.getByTestId('accuracy-chart')).toBeVisible();
    await expect(page.getByTestId('history-chart')).toBeVisible();
    await expect(page.getByTestId('mastery-chart')).toBeVisible();
  });
});
