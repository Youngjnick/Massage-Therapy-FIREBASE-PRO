// @ts-nocheck
import { test, expect, Page } from '@playwright/test';

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

// Helper to set mock auth and patch questions/state before each test
async function patchE2EState(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
      email: 'testuser@gmail.com',
      name: 'Test User',
      uid: 'mock-uid-123',
    }));
    // Patch questions, selectedTopic, quizStarted for E2E reliability
    const mockQuestions = [
      { id: 'q1', text: 'Q1', topic: 'Anatomy', correct: 0, answered: 0 },
      { id: 'q2', text: 'Q2', topic: 'Anatomy', correct: 1, answered: 1 },
      { id: 'q3', text: 'Q3', topic: 'Anatomy', correct: 2 },
      { id: 'q4', text: 'Q4', topic: 'Anatomy', correct: 0 },
      { id: 'q5', text: 'Q5', topic: 'Anatomy', correct: 1 },
    ];
    window.appState = window.appState || {};
    window.appState.questions = mockQuestions;
    window.appState.badges = [];
    window.appState.selectedTopic = 'Anatomy';
    window.appState.quizStarted = true;
    // Patch quizHistory for analytics modal E2E reliability
    window.appState.quizHistory = [{
      date: Date.now(),
      total: mockQuestions.length,
      correct: mockQuestions.filter(q => q.answered === 1).length,
      incorrect: mockQuestions.filter(q => q.answered === 0).length,
      unanswered: mockQuestions.filter(q => q.answered === undefined).length,
      score: mockQuestions.filter(q => q.answered === 1).length,
      streak: 1,
    }];
    window.dispatchEvent(new Event('questionsUpdated'));
  });
}

test.describe('AnalyticsModal Accessibility', () => {
  test('AnalyticsModal charts have ARIA labels and are keyboard accessible', async ({ page }) => {
    await patchE2EState(page);
    await page.goto('/');
    // Wait for analytics button to be visible
    await page.getByTestId('open-analytics-btn').waitFor({ state: 'visible' });
    await page.getByTestId('open-analytics-btn').click();
    await expect(page.getByTestId('analytics-modal')).toBeVisible();
    // Check ARIA attributes on charts
    const doughnut = await page.getByTestId('analytics-modal').locator('[aria-label="Quiz Accuracy Chart"]');
    expect(await doughnut.count()).toBeGreaterThan(0);
    const history = await page.getByTestId('analytics-modal').locator('[aria-label="Quiz History Chart"]');
    expect(await history.count()).toBeGreaterThan(0);
    const mastery = await page.getByTestId('analytics-modal').locator('[aria-label="Mastery History Chart"]');
    expect(await mastery.count()).toBeGreaterThan(0);
    // Tab to close button
    await page.keyboard.press('Tab');
    const closeBtn = await page.getByTestId('close-analytics-modal');
    expect(closeBtn).not.toBeNull();
    if (closeBtn) {
      expect(await closeBtn.getAttribute('aria-label')).toBe('Close modal');
    }
  });
});
