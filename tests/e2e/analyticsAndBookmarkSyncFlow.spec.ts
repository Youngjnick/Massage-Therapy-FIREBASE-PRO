// @ts-nocheck
// Playwright E2E: Analytics and Bookmark Firestore Sync & Persistence
import { test, expect } from '@playwright/test';
import { setTestStateWithWait, waitForAppReady, waitForFullBadgeSync } from './helpers/e2eDebugHelpers';
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

test.describe('Analytics and Bookmark Firestore Sync', () => {
  test('Analytics and bookmarks sync to Firestore and persist after reload', async ({ page }) => {
    // Clear quiz/bookmark/analytics-related localStorage and set E2E flags before navigation
    await page.addInitScript(() => {
      window.__E2E_TEST__ = true;
      window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
        email: 'testuser@gmail.com',
        name: 'Test User',
        uid: 'mock-uid-123',
      }));
      localStorage.removeItem('quizResults');
      localStorage.removeItem('quizStats');
      localStorage.removeItem('quizHistory');
      localStorage.removeItem('quizMastery');
      localStorage.removeItem('quizProgress');
      localStorage.removeItem('bookmarks');
      localStorage.removeItem('analytics');
    });
    await page.goto('http://localhost:5173');
    await waitForAppReady(page);
    // Inject E2E state after app is loaded and E2E hook is attached
    await setTestStateWithWait(page, {
      questions: [
        { id: 'q1', question: 'Q1', answers: ['A', 'B', 'C'], correct: 0, answered: 0, topic: 'Anatomy' },
        { id: 'q2', question: 'Q2', answers: ['A', 'B', 'C'], correct: 1, topic: 'Anatomy' },
        { id: 'q3', question: 'Q3', answers: ['A', 'B', 'C'], correct: 2, topic: 'Anatomy' },
        { id: 'q4', question: 'Q4', answers: ['A', 'B', 'C'], correct: 0, topic: 'Anatomy' },
        { id: 'q5', question: 'Q5', answers: ['A', 'B', 'C'], correct: 1, topic: 'Anatomy' }
      ],
      badges: [
        { id: 'test', name: 'Test Badge', earned: true, image: '/badges/default.png', description: 'E2E Test Badge' }
      ],
      selectedTopic: 'Anatomy',
      quizStarted: true
    });
    // Ensure badge state is fully synced in all contexts before proceeding
    await waitForFullBadgeSync(page, 'test');
    // Wait for React E2E hook to be available
    await page.waitForFunction(() => typeof window.__REACT_SET_TEST_STATE__ === 'function', null, { timeout: 10000 });
    // Debug: log appState and React debug state
    const appStateQuestions = await page.evaluate(() => window.appState && window.appState.questions);
    const reactQuestions = await page.evaluate(() => window.__E2E_DEBUG_STATE__ && window.__E2E_DEBUG_STATE__.questions);
    console.log('E2E DEBUG: appState.questions after setTestStateWithWait:', appStateQuestions);
    console.log('E2E DEBUG: __E2E_DEBUG_STATE__.questions after setTestStateWithWait:', reactQuestions);
    // Wait for React to render questions
    await page.waitForFunction(() => Array.isArray(window.__E2E_DEBUG_STATE__?.questions) && window.__E2E_DEBUG_STATE__.questions.length > 0);
    // Close any open modals before UI actions (robustness)
    if (typeof closeModalsIfOpen === 'function') await closeModalsIfOpen(page);
    // Bookmark first question
    await page.waitForTimeout(500); // Give React a moment to render
    // Debug: log questions state before clicking bookmark
    const questions = await page.evaluate(() => window.appState && window.appState.questions);
    console.log('E2E DEBUG: questions state before bookmark:', questions);
    await page.waitForSelector('[data-testid="bookmark-btn"]', { state: 'visible', timeout: 10000 }).catch(() => console.log('Timed out waiting for bookmark-btn'));
    await page.getByTestId('bookmark-btn').click();
    // Open analytics modal and check stats
    await page.locator('[data-testid="open-analytics-btn"]').first().click();
    await expect(page.getByTestId('analytics-modal')).toBeVisible();
    // Debug: take a screenshot after opening modal
    await page.screenshot({ path: 'test-results/after-analytics-modal-bookmark-sync.png', fullPage: true });
    // Debug: log analytics modal HTML
    const modalHtml = await page.getByTestId('analytics-modal').evaluate(el => el ? el.innerHTML : null).catch(() => null);
    console.log('ANALYTICS MODAL HTML:', modalHtml);
    // Debug: log badge debug JSON if present, and wait for it to be non-null
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="analytics-modal"] [data-testid="badge-debug-json-analytics"]');
      return el && el.textContent && el.textContent !== 'null';
    }, { timeout: 10000 }).catch(() => console.log('Timed out waiting for badge debug JSON to be non-null'));
    const debugJson = await page.getByTestId('analytics-modal').locator('[data-testid="badge-debug-json-analytics"]').textContent().catch(() => null);
    console.log('BADGE DEBUG JSON:', debugJson);
    // Debug: log all badge-earned-test elements
    const badgeEarnedEls = await page.getByTestId('analytics-modal').locator('[data-testid^="badge-earned-"]').evaluateAll(els => els.map(e => e.outerHTML));
    console.log('BADGE-EARNED ELEMENTS:', badgeEarnedEls);
    // Debug: log count of badge-earned-test elements
    const badgeTestCount = await page.getByTestId('analytics-modal').locator('[data-testid="badge-earned-test"]').evaluateAll(els => els.length);
    console.log('BADGE-EARNED-TEST COUNT:', badgeTestCount);
    if (badgeTestCount === 0) {
      throw new Error('No badge-earned-test element found. BADGE-EARNED ELEMENTS: ' + JSON.stringify(badgeEarnedEls));
    }
    const statsText1 = await page.getByTestId('analytics-modal').innerText();
    expect(statsText1).toContain('Total Questions: 5');
    await expect(page.getByTestId('accuracy-chart')).toBeVisible();
    await page.getByTestId('close-analytics-modal').click();
    // Reload and re-inject E2E state after reload
    await page.reload();
    await waitForAppReady(page);
    await setTestStateWithWait(page, {
      questions: [
        { id: 'q1', question: 'Q1', answers: ['A', 'B', 'C'], correct: 0, answered: 0, topic: 'Anatomy' },
        { id: 'q2', question: 'Q2', answers: ['A', 'B', 'C'], correct: 1, topic: 'Anatomy' },
        { id: 'q3', question: 'Q3', answers: ['A', 'B', 'C'], correct: 2, topic: 'Anatomy' },
        { id: 'q4', question: 'Q4', answers: ['A', 'B', 'C'], correct: 0, topic: 'Anatomy' },
        { id: 'q5', question: 'Q5', answers: ['A', 'B', 'C'], correct: 1, topic: 'Anatomy' }
      ],
      badges: [
        { id: 'test', name: 'Test Badge', earned: true, image: '/badges/default.png', description: 'E2E Test Badge' }
      ],
      selectedTopic: 'Anatomy',
      quizStarted: true
    });
    // Ensure badge state is fully synced in all contexts before proceeding
    await waitForFullBadgeSync(page, 'test');
    // --- Force badge context sync after reload and state injection ---
    await page.evaluate(() => { if (typeof window.__SYNC_BADGES__ === 'function') window.__SYNC_BADGES__(); });
    await page.waitForFunction(() => typeof window.__REACT_SET_TEST_STATE__ === 'function', null, { timeout: 10000 });
    const appStateQuestionsReload = await page.evaluate(() => window.appState && window.appState.questions);
    const reactQuestionsReload = await page.evaluate(() => window.__E2E_DEBUG_STATE__ && window.__E2E_DEBUG_STATE__.questions);
    console.log('E2E DEBUG: appState.questions after reload:', appStateQuestionsReload);
    console.log('E2E DEBUG: __E2E_DEBUG_STATE__.questions after reload:', reactQuestionsReload);
    await page.waitForFunction(() => Array.isArray(window.__E2E_DEBUG_STATE__?.questions) && window.__E2E_DEBUG_STATE__.questions.length > 0);
    // Close any open modals before UI actions (robustness)
    if (typeof closeModalsIfOpen === 'function') await closeModalsIfOpen(page);
    // Wait for bookmarks sidebar button to be visible before clicking
    await page.waitForSelector('[data-testid="bookmarks-sidebar-btn"]', { state: 'visible', timeout: 10000 }).catch(() => console.log('Timed out waiting for bookmarks-sidebar-btn'));
    await page.getByTestId('bookmarks-sidebar-btn').click();
    await expect(page.getByTestId('bookmarked-question')).toBeVisible();
    // Open analytics modal and check stats again
    await page.locator('[data-testid="open-analytics-btn"]').first().click();
    await expect(page.getByTestId('analytics-modal')).toBeVisible();
    const statsText2 = await page.getByTestId('analytics-modal').innerText();
    expect(statsText2).toContain('Total Questions: 5');
    await expect(page.getByTestId('accuracy-chart')).toBeVisible();
  });

  test('Analytics and bookmark sync: badge and analytics state after reload', async ({ page }) => {
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
    await printBadgeState(page, 'after setTestStateWithWait - analytics/bookmark sync');
    // Wait for React E2E hook to be available
    await page.waitForFunction(() => typeof window.__REACT_SET_TEST_STATE__ === 'function', null, { timeout: 10000 });
    // Debug: log appState and React debug state
    const appStateQuestions = await page.evaluate(() => window.appState && window.appState.questions);
    const reactQuestions = await page.evaluate(() => window.__E2E_DEBUG_STATE__ && window.__E2E_DEBUG_STATE__.questions);
    console.log('E2E DEBUG: appState.questions after setTestStateWithWait:', appStateQuestions);
    console.log('E2E DEBUG: __E2E_DEBUG_STATE__.questions after setTestStateWithWait:', reactQuestions);
    // Wait for React to render questions
    await page.waitForFunction(() => Array.isArray(window.__E2E_DEBUG_STATE__?.questions) && window.__E2E_DEBUG_STATE__.questions.length > 0);
    // Close any open modals before UI actions (robustness)
    if (typeof closeModalsIfOpen === 'function') await closeModalsIfOpen(page);
    // Bookmark first question
    await page.waitForTimeout(500); // Give React a moment to render
    // Debug: log questions state before clicking bookmark
    const questions = await page.evaluate(() => window.appState && window.appState.questions);
    console.log('E2E DEBUG: questions state before bookmark:', questions);
    await page.waitForSelector('[data-testid="bookmark-btn"]', { state: 'visible', timeout: 10000 }).catch(() => console.log('Timed out waiting for bookmark-btn'));
    await page.getByTestId('bookmark-btn').click();
    // Open analytics modal and check stats
    await page.locator('[data-testid="open-analytics-btn"]').first().click();
    await expect(page.getByTestId('analytics-modal')).toBeVisible();
    // Debug: take a screenshot after opening modal
    await page.screenshot({ path: 'test-results/after-analytics-modal-bookmark-sync.png', fullPage: true });
    // Debug: log analytics modal HTML
    const modalHtml = await page.getByTestId('analytics-modal').evaluate(el => el ? el.innerHTML : null).catch(() => null);
    console.log('ANALYTICS MODAL HTML:', modalHtml);
    // Debug: log badge debug JSON if present, and wait for it to be non-null
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="analytics-modal"] [data-testid="badge-debug-json-analytics"]');
      return el && el.textContent && el.textContent !== 'null';
    }, { timeout: 10000 }).catch(() => console.log('Timed out waiting for badge debug JSON to be non-null'));
    const debugJson = await page.getByTestId('analytics-modal').locator('[data-testid="badge-debug-json-analytics"]').textContent().catch(() => null);
    console.log('BADGE DEBUG JSON:', debugJson);
    // Debug: log all badge-earned-test elements
    const badgeEarnedEls = await page.getByTestId('analytics-modal').locator('[data-testid^="badge-earned-"]').evaluateAll(els => els.map(e => e.outerHTML));
    console.log('BADGE-EARNED ELEMENTS:', badgeEarnedEls);
    // Debug: log count of badge-earned-test elements
    const badgeTestCount = await page.getByTestId('analytics-modal').locator('[data-testid="badge-earned-test"]').evaluateAll(els => els.length);
    console.log('BADGE-EARNED-TEST COUNT:', badgeTestCount);
    if (badgeTestCount === 0) {
      throw new Error('No badge-earned-test element found. BADGE-EARNED ELEMENTS: ' + JSON.stringify(badgeEarnedEls));
    }
    const statsText1 = await page.getByTestId('analytics-modal').innerText();
    expect(statsText1).toContain('Total Questions: 5');
    await expect(page.getByTestId('accuracy-chart')).toBeVisible();
    await page.getByTestId('close-analytics-modal').click();
    // Reload and re-inject E2E state after reload
    await page.reload();
    await waitForAppReady(page);
    await setTestStateWithWait(page, {
      questions: [
        { id: 'q1', question: 'Q1', answers: ['A', 'B', 'C'], correct: 0, answered: 0, topic: 'Anatomy' },
        { id: 'q2', question: 'Q2', answers: ['A', 'B', 'C'], correct: 1, topic: 'Anatomy' },
        { id: 'q3', question: 'Q3', answers: ['A', 'B', 'C'], correct: 2, topic: 'Anatomy' },
        { id: 'q4', question: 'Q4', answers: ['A', 'B', 'C'], correct: 0, topic: 'Anatomy' },
        { id: 'q5', question: 'Q5', answers: ['A', 'B', 'C'], correct: 1, topic: 'Anatomy' }
      ],
      badges: [
        { id: 'test', name: 'Test Badge', earned: true, image: '/badges/default.png', description: 'E2E Test Badge' }
      ],
      selectedTopic: 'Anatomy',
      quizStarted: true
    });
    // Ensure badge state is fully synced in all contexts before proceeding
    await waitForFullBadgeSync(page, 'test');
    // --- Force badge context sync after reload and state injection ---
    await page.evaluate(() => { if (typeof window.__SYNC_BADGES__ === 'function') window.__SYNC_BADGES__(); });
    await page.waitForFunction(() => typeof window.__REACT_SET_TEST_STATE__ === 'function', null, { timeout: 10000 });
    const appStateQuestionsReload = await page.evaluate(() => window.appState && window.appState.questions);
    const reactQuestionsReload = await page.evaluate(() => window.__E2E_DEBUG_STATE__ && window.__E2E_DEBUG_STATE__.questions);
    console.log('E2E DEBUG: appState.questions after reload:', appStateQuestionsReload);
    console.log('E2E DEBUG: __E2E_DEBUG_STATE__.questions after reload:', reactQuestionsReload);
    await page.waitForFunction(() => Array.isArray(window.__E2E_DEBUG_STATE__?.questions) && window.__E2E_DEBUG_STATE__.questions.length > 0);
    // Close any open modals before UI actions (robustness)
    if (typeof closeModalsIfOpen === 'function') await closeModalsIfOpen(page);
    // Wait for bookmarks sidebar button to be visible before clicking
    await page.waitForSelector('[data-testid="bookmarks-sidebar-btn"]', { state: 'visible', timeout: 10000 }).catch(() => console.log('Timed out waiting for bookmarks-sidebar-btn'));
    await page.getByTestId('bookmarks-sidebar-btn').click();
    await expect(page.getByTestId('bookmarked-question')).toBeVisible();
    // Open analytics modal and check stats again
    await page.locator('[data-testid="open-analytics-btn"]').first().click();
    await expect(page.getByTestId('analytics-modal')).toBeVisible();
    const statsText2 = await page.getByTestId('analytics-modal').innerText();
    expect(statsText2).toContain('Total Questions: 5');
    await expect(page.getByTestId('accuracy-chart')).toBeVisible();
  });
});
