// @ts-nocheck
import { test, expect } from '@playwright/test';
import { setTestStateWithWait, waitForAppReady, mockAuth, waitForBadgeState, waitForFullBadgeSync } from './helpers/e2eDebugHelpers';
import { printBadgeState } from './helpers/printBadgeState';

test.describe('Analytics and Badges E2E', () => {
  // Helper: Retry opening modal and waiting for badge-earned-test
  async function openModalAndWaitForBadge(page, openModalFn, modalSelector, badgeSelector, debugLabel) {
    let lastError = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await openModalFn();
        await page.waitForSelector(modalSelector, { state: 'visible', timeout: 10000 });
        await page.waitForFunction(() => !!document.querySelector(badgeSelector), { timeout: 5000 });
        // Debug output
        const badgeEls = await page.$$eval(badgeSelector, els => els.map(e => e.outerHTML));
        console.log(`[E2E][${debugLabel}] badge-earned-test elements:`, badgeEls);
        return;
      } catch (e) {
        lastError = e;
        // Try to close modal if open
        try { await page.keyboard.press('Escape'); } catch {}
        await page.waitForTimeout(500);
      }
    }
    throw new Error(`[E2E][${debugLabel}] Failed to open modal and find badge-earned-test after 3 attempts: ` + (lastError?.message || lastError));
  }

  test('Analytics modal shows all charts and badge images', async ({ page }) => {
    await page.addInitScript(() => {
      window.__E2E_TEST__ = true;
      window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
        email: 'testuser@gmail.com',
        name: 'Test User',
        uid: 'mock-uid-123',
      }));
    });
    await page.goto('http://localhost:5173');
    await waitForAppReady(page);
    await setTestStateWithWait(page, {
      questions: [{
        id: 'q1',
        question: 'Sample?',
        correct: 0,
        answered: 0,
        topic: 'Test',
      }],
      badges: [{ id: 'welcome', name: 'Welcome', earned: true, icon: 'welcome.png', description: 'Awarded on your first login. Welcome to the platform!' }],
    });
    // Ensure badge state is fully synced in all contexts before proceeding
    await waitForFullBadgeSync(page, 'welcome');
    await printBadgeState(page, 'after setTestStateWithWait - analytics modal charts');
    await waitForBadgeState(page);
    await expect(page.locator('[data-testid="open-analytics-btn"]').first()).toBeVisible();
    await openModalAndWaitForBadge(
      page,
      async () => { await page.locator('[data-testid="open-analytics-btn"]').first().click(); },
      '[data-testid="analytics-modal"]',
      '[data-testid="analytics-modal"] [data-testid="badge-earned-test"]',
      'analytics-modal'
    );
    // Debug: log window state after test state injection
    const appState = await page.evaluate(() => JSON.stringify(window.appState));
    console.log('window.appState after setTestState:', appState);
    let badges = null;
    try {
      badges = await page.evaluate(() => JSON.stringify(window.badges));
    } catch {
      badges = 'window.badges not defined';
    }
    console.log('window.badges after setTestState:', badges);
    const setTestStateType = await page.evaluate(() => typeof window.setTestState);
    console.log('typeof window.setTestState:', setTestStateType);
    const visibleButtons = await page.$$eval('button, [role="button"]', btns => btns.map(b => b.textContent));
    console.log('VISIBLE BUTTONS BEFORE WAIT:', visibleButtons);
    const modal = await page.locator('[data-testid="analytics-modal"]');
    if (!(await modal.isVisible())) {
      await page.getByTestId('analytics-btn').click();
    }
    await expect(modal).toBeVisible();
    await page.screenshot({ path: 'test-results/after-analytics-modal-open.png', fullPage: true });
    const modalHtml = await page.locator('[data-testid="analytics-modal"]').evaluate(el => el ? el.innerHTML : null).catch(() => null);
    console.log('ANALYTICS MODAL HTML:', modalHtml);
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="analytics-modal"] [data-testid="badge-debug-json-analytics"]');
      return el && el.textContent && el.textContent.includes('test');
    }, { timeout: 10000 }).catch(() => console.log('Timed out waiting for badge debug JSON to be non-null'));
    const debugJson = await page.locator('[data-testid="analytics-modal"] [data-testid="badge-debug-json-analytics"]').textContent().catch(() => null);
    console.log('BADGE DEBUG JSON:', debugJson);
    const badgeEarnedEls = await page.$$eval('[data-testid="analytics-modal"] [data-testid^="badge-earned-"]', els => els.map(e => e.outerHTML));
    console.log('BADGE-EARNED ELEMENTS:', badgeEarnedEls);
    const badgeTestCount = await page.$$eval('[data-testid="analytics-modal"] [data-testid="badge-earned-test"]', els => els.length);
    console.log('BADGE-EARNED-TEST COUNT:', badgeTestCount);
    if (badgeTestCount === 0) {
      throw new Error('No badge-earned-test element found. BADGE-EARNED ELEMENTS: ' + JSON.stringify(badgeEarnedEls));
    }
    await page.waitForFunction(() => !!document.querySelector('[data-testid="analytics-modal"] [data-testid="badge-earned-test"]'));
    await expect(page.getByTestId('badge-earned-test')).toBeVisible();
    await page.getByTestId('close-analytics-modal').click();
    await expect(page.getByTestId('analytics-modal')).not.toBeVisible();
  });

  test('Smart Learning modal shows badge images and progress', async ({ page }) => {
    await mockAuth(page);
    await page.goto('http://localhost:5173');
    await page.waitForFunction(() => !!window.__E2E_HOOK_ATTACHED);
    await setTestStateWithWait(page, {
      questions: [{
        id: 'q1',
        question: 'Sample?',
        correct: 0,
        answered: 0,
        topic: 'Test',
      }],
      badges: [{ id: 'test', name: 'Test Badge', earned: true, image: '/badges/default.png', description: 'E2E Test Badge' }],
    });
    await waitForBadgeState(page);
    const appStateBadges = await page.evaluate(() => (window.appState && window.appState.badges) ? JSON.stringify(window.appState.badges) : 'no appState.badges');
    console.log('window.appState.badges BEFORE SMART LEARNING MODAL:', appStateBadges);
    await openModalAndWaitForBadge(
      page,
      async () => { await page.getByTestId('smart-learning-link').click(); },
      '[data-testid="smart-learning-modal"]',
      '[data-testid="smart-learning-modal"] [data-testid="badge-earned-test"]',
      'smart-learning-modal'
    );
    await page.screenshot({ path: 'test-results/after-smart-learning-modal-open.png', fullPage: true });
    const modalHtml = await page.locator('[data-testid="smart-learning-modal"]').evaluate(el => el ? el.innerHTML : null).catch(() => null);
    console.log('SMART LEARNING MODAL HTML:', modalHtml);
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="smart-learning-modal"] [data-testid="badge-debug-json-smart-learning"]');
      return el && el.textContent && el.textContent.includes('test');
    }, { timeout: 10000 }).catch(() => console.log('Timed out waiting for badge debug JSON to be non-null'));
    const debugJson = await page.locator('[data-testid="smart-learning-modal"] [data-testid="badge-debug-json-smart-learning"]').textContent().catch(() => null);
    console.log('BADGE DEBUG JSON:', debugJson);
    const badgeEarnedEls2 = await page.$$eval('[data-testid="smart-learning-modal"] [data-testid^="badge-earned-"]', els => els.map(e => e.outerHTML));
    console.log('BADGE-EARNED ELEMENTS (SMART LEARNING):', badgeEarnedEls2);
    const badgeTestCount2 = await page.$$eval('[data-testid="smart-learning-modal"] [data-testid="badge-earned-test"]', els => els.length);
    console.log('BADGE-EARNED-TEST COUNT (SMART LEARNING):', badgeTestCount2);
    if (badgeTestCount2 === 0) {
      throw new Error('No badge-earned-test element found in smart learning modal. BADGE-EARNED ELEMENTS: ' + JSON.stringify(badgeEarnedEls2));
    }
    await page.waitForFunction(() => !!document.querySelector('[data-testid="smart-learning-modal"] [data-testid="badge-earned-test"]'));
    await expect(page.getByTestId('badge-earned-test')).toBeVisible();
    await page.getByTestId('close-smart-learning-modal').click();
    await expect(page.getByTestId('smart-learning-modal')).not.toBeVisible();
  });
});
