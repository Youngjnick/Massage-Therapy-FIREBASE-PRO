// @ts-nocheck
// tests/analyticsFlicker.spec.ts
// Playwright E2E test: Ensures analytics panel and charts do not flicker or disappear
// Run with: npx playwright test tests/analyticsFlicker.spec.ts

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
      { id: 'q2', text: 'Q2', topic: 'Anatomy', correct: 1 },
      { id: 'q3', text: 'Q3', topic: 'Anatomy', correct: 2 },
      { id: 'q4', text: 'Q4', topic: 'Anatomy', correct: 0 },
      { id: 'q5', text: 'Q5', topic: 'Anatomy', correct: 1 },
    ];
    window.appState = window.appState || {};
    window.appState.questions = mockQuestions;
    window.appState.badges = [];
    window.appState.selectedTopic = 'Anatomy';
    window.appState.quizStarted = true;
    window.dispatchEvent(new Event('questionsUpdated'));
  });
}

test.describe('Analytics Flicker', () => {
  test('Analytics panel and charts remain visible and stable', async ({ page }) => {
    await patchE2EState(page);
    await page.goto('http://localhost:5173');
    // Wait for analytics button to be visible and open analytics modal
    await page.locator('[data-testid="open-analytics-btn"]').first().waitFor({ state: 'visible' });
    await page.locator('[data-testid="open-analytics-btn"]').first().click();
    await expect(page.getByTestId('analytics-modal')).toBeVisible();
    // Wait for chart canvases to appear
    const canvasCount = await page.locator('canvas').count();
    expect(canvasCount).toBeGreaterThan(0);
    // Debug: take a screenshot for visual regression
    await page.screenshot({ path: 'test-results/analytics-flicker-panel.png', fullPage: true });
    // Wait 2 seconds and take another screenshot
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/analytics-flicker-panel-2.png', fullPage: true });
    // Optionally, check that chart canvases are still present
    const canvasCount2 = await page.locator('canvas').count();
    expect(canvasCount2).toBeGreaterThan(0);
  });
});
