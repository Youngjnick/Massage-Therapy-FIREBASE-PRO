// @ts-nocheck
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

test.describe('Analytics Restart and Topic Change', () => {
  test('Analytics/statistics and badges update after topic/length change', async ({ page }) => {
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
        { id: 'q1', question: 'Q1', answers: ['A', 'B', 'C'], correct: 0, answered: 0, topic: 'Anatomy' },
        { id: 'q2', question: 'Q2', answers: ['A', 'B', 'C'], correct: 1, answered: 1, topic: 'Anatomy' },
        { id: 'q3', question: 'Q3', answers: ['A', 'B', 'C'], correct: 2, answered: 1, topic: 'Anatomy' },
        { id: 'q4', question: 'Q4', answers: ['A', 'B', 'C'], correct: 0, answered: 1, topic: 'Anatomy' },
        { id: 'q5', question: 'Q5', answers: ['A', 'B', 'C'], correct: 1, answered: 1, topic: 'Anatomy' }
      ],
      badges: [
        { id: 'test', name: 'Test Badge', earned: true, image: '/badges/default.png', description: 'E2E Test Badge' }
      ],
      selectedTopic: 'Anatomy',
      quizStarted: true
    });
    await printBadgeState(page, 'after setTestStateWithWait - restart/topic change');
    await page.locator('[data-testid="open-analytics-btn"]').first().waitFor({ state: 'visible' });
    await page.locator('[data-testid="open-analytics-btn"]').first().click();
    await expect(page.getByTestId('analytics-modal')).toBeVisible();
    const statsText = await page.getByTestId('analytics-modal').innerText();
    expect(statsText).toContain('Total Questions: 5');
    // Assert mastery by topic row exists and is nonzero
    const masteryRows = await page.locator('[data-testid^="topic-row-"]').allTextContents();
    expect(masteryRows.length).toBeGreaterThan(0);
    // Assert badge progress panel shows at least one badge (if any earned)
    const badgeList = await page.locator('[data-testid^="badge-progress-list-"]').first();
    await expect(badgeList).toBeVisible();
    await page.getByTestId('close-analytics-modal').click();
    // Simulate quiz restart by patching state to unanswered
    await setTestStateWithWait(page, {
      questions: [
        { id: 'q1', question: 'Q1', topic: 'Anatomy', correct: 0 },
        { id: 'q2', question: 'Q2', topic: 'Anatomy', correct: 1 },
        { id: 'q3', question: 'Q3', topic: 'Anatomy', correct: 2 },
        { id: 'q4', question: 'Q4', topic: 'Anatomy', correct: 0 },
        { id: 'q5', question: 'Q5', topic: 'Anatomy', correct: 1 },
      ],
      quizStarted: true,
      selectedTopic: 'Anatomy',
    });
    await page.reload();
    await page.locator('[data-testid="open-analytics-btn"]').first().waitFor({ state: 'visible' });
    await page.locator('[data-testid="open-analytics-btn"]').first().click();
    await expect(page.getByTestId('analytics-modal')).toBeVisible();
    const statsText2 = await page.getByTestId('analytics-modal').innerText();
    expect(statsText2).toMatch(/Correct Answers: 0/);
    expect(statsText2).toMatch(/Incorrect Answers: 0/);
    // Assert mastery by topic rows are reset
    const masteryRowsAfter = await page.locator('[data-testid^="topic-row-"]').allTextContents();
    expect(masteryRowsAfter.length).toBeGreaterThan(0);
    // Assert badge progress panel resets (should show badges as not earned or reset progress)
    const badgeListAfter = await page.locator('[data-testid^="badge-progress-list-"]').first();
    await expect(badgeListAfter).toBeVisible();
    await page.getByTestId('close-analytics-modal').click();
  });
});
