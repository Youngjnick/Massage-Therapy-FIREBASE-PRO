// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from './test.setup';
import { openModalAndWaitForBadge, setTestStateWithWait, waitForBadgeState, waitForFullBadgeSync } from './helpers/e2eDebugHelpers';
import { printBadgeState } from './helpers/printBadgeState';
import { waitForAppReady } from '../helpers/e2eAppReadyHelpers';
import { syncBadgesE2E } from '../helpers/e2eBadgeSyncHelpers';
import { closeModalsIfOpen } from '../helpers/e2eBadgeTestHelpers';
import { openAnalyticsModal, expectAllBadgeImagesVisible, expectNoBadgeDescriptionForUnearned } from '../helpers/e2eBadgeModalHelpers';

test.describe('Analytics and Badges E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Remove addInitScript: E2E globals are now set in e2e-badge-patch.ts
    page.on('console', msg => {
      // Print all browser console logs for debugging
      console.log(`[browser console.${msg.type()}]`, msg.text());
    });
    page.on('pageerror', error => {
      console.error('[browser pageerror]', error);
    });
    await page.goto('http://localhost:5173');
    // Poll for badge state mirrors to be in sync (robust against event timing)
    await page.waitForFunction(() => {
      return window.__E2E_DEBUG_STATE__ && window.__E2E_DEBUG_STATE__.syncFlushed;
    }, { timeout: 30000 });
  });

  test('Analytics modal displays correct badge count', async ({ page }) => {
    await waitForAppReady(page);
    await waitForAppReady(page); // Ensure app is ready before badge injection
    await page.evaluate(() => {
      window.setE2EBadges && window.setE2EBadges(['test', 'second']);
    });
    await syncBadgesE2E(page);
    await waitForAppReady(page); // Ensure app is ready before setTestStateWithWait
    await setTestStateWithWait(page, {
      questions: [{ question: 'Q', answers: ['A'], correct: 0, answered: 0 }],
      badges: [
        { id: 'test', name: 'Test Badge', earned: true, image: '/badges/default.png', description: 'Badge 1' },
        { id: 'second', name: 'Second Badge', earned: true, image: '/badges/default2.png', description: 'Badge 2' },
        { id: 'third', name: 'Third Badge', earned: false, image: '/badges/default3.png', description: 'Badge 3' }
      ],
    });
    await page.reload(); // PATCH: Reload after state injection
    await syncBadgesE2E(page);
    await waitForFullBadgeSync(page, 'test');
    await waitForFullBadgeSync(page, 'second');
    await waitForFullBadgeSync(page, 'third');
    await printBadgeState(page, 'after setTestStateWithWait - correct badge count');
    await closeModalsIfOpen(page);
    await page.waitForSelector('#profileBtn', { state: 'visible', timeout: 10000 });
    await openAnalyticsModal(page);
    const earnedBadges = await page.$$('[data-testid^="badge-earned-"]');
    expect(earnedBadges.length).toBe(2);
  });

  test('Analytics modal badge images are visible', async ({ page }) => {
    await waitForAppReady(page);
    await waitForAppReady(page); // Ensure app is ready before badge injection
    await page.evaluate(() => {
      window.setE2EBadges && window.setE2EBadges(['test', 'second']);
    });
    await syncBadgesE2E(page);
    await waitForAppReady(page); // Ensure app is ready before setTestStateWithWait
    await setTestStateWithWait(page, {
      questions: [{ question: 'Q', answers: ['A'], correct: 0, answered: 0 }],
      badges: [
        { id: 'test', name: 'Test Badge', earned: true, image: '/badges/default.png', description: 'Badge 1' },
        { id: 'second', name: 'Second Badge', earned: true, image: '/badges/default2.png', description: 'Badge 2' },
        { id: 'third', name: 'Third Badge', earned: false, image: '/badges/default3.png', description: 'Badge 3' }
      ],
    });
    await syncBadgesE2E(page);
    await waitForFullBadgeSync(page, 'test');
    await waitForFullBadgeSync(page, 'second');
    await waitForFullBadgeSync(page, 'third');
    await printBadgeState(page, 'after setTestStateWithWait - badge images visible');
    await closeModalsIfOpen(page);
    await page.waitForSelector('#profileBtn', { state: 'visible', timeout: 10000 });
    await openAnalyticsModal(page);
    await expectAllBadgeImagesVisible(page);
  });

  test('Analytics modal badge description is not shown for unearned badges', async ({ page }) => {
    await waitForAppReady(page);
    await waitForAppReady(page); // Ensure app is ready before badge injection
    await page.evaluate(() => {
      window.setE2EBadges && window.setE2EBadges(['test']);
    });
    await syncBadgesE2E(page);
    await waitForAppReady(page); // Ensure app is ready before setTestStateWithWait
    await setTestStateWithWait(page, {
      questions: [{ question: 'Q', answers: ['A'], correct: 0, answered: 0 }],
      badges: [
        { id: 'test', name: 'Test Badge', earned: true, image: '/badges/default.png', description: 'Badge 1' },
        { id: 'second', name: 'Second Badge', earned: false, image: '/badges/default2.png', description: 'Badge 2' }
      ],
    });
    await syncBadgesE2E(page);
    await waitForFullBadgeSync(page, 'test');
    await waitForFullBadgeSync(page, 'second');
    await printBadgeState(page, 'after setTestStateWithWait - badge description not shown for unearned');
    await closeModalsIfOpen(page);
    await page.waitForSelector('#profileBtn', { state: 'visible', timeout: 10000 });
    await openAnalyticsModal(page);
    await expectNoBadgeDescriptionForUnearned(page, 'second');
  });

  test('Analytics modal badge list is keyboard accessible', async ({ page }) => {
    await waitForAppReady(page);
    await waitForAppReady(page); // Ensure app is ready before badge injection
    await page.evaluate(() => {
      window.setE2EBadges && window.setE2EBadges(['test', 'second']);
    });
    await syncBadgesE2E(page);
    await waitForAppReady(page); // Ensure app is ready before setTestStateWithWait
    await setTestStateWithWait(page, {
      questions: [{ question: 'Q', answers: ['A'], correct: 0, answered: 0 }],
      badges: [
        { id: 'test', name: 'Test Badge', earned: true, image: '/badges/default.png', description: 'Badge 1' },
        { id: 'second', name: 'Second Badge', earned: true, image: '/badges/default2.png', description: 'Badge 2' },
        { id: 'third', name: 'Third Badge', earned: false, image: '/badges/default3.png', description: 'Badge 3' }
      ],
    });
    await syncBadgesE2E(page);
    await waitForFullBadgeSync(page, 'test');
    await waitForFullBadgeSync(page, 'second');
    await waitForFullBadgeSync(page, 'third');
    await printBadgeState(page, 'after setTestStateWithWait - badge list keyboard accessible');
    await closeModalsIfOpen(page);
    await page.waitForSelector('#profileBtn', { state: 'visible', timeout: 10000 });
    await page.click('#profileBtn');
    await page.waitForSelector('[data-testid="profile-modal"]', { state: 'visible', timeout: 10000 });
    await page.getByTestId('analytics-btn').click();
    await page.waitForSelector('[data-testid="analytics-modal"]', { state: 'visible', timeout: 10000 });
    // Try to tab through badge list
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    // Add more keyboard accessibility checks as needed
    // Example: check that a badge is focused
    const focused = await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-testid'));
    expect(focused && focused.startsWith('badge-earned-')).toBeTruthy();
  });

  test('Analytics modal closes when clicking close button', async ({ page }) => {
    await waitForAppReady(page);
    await waitForAppReady(page); // Ensure app is ready before setTestStateWithWait
    await setTestStateWithWait(page, {
      questions: [{ question: 'Q', answers: ['A'], correct: 0, answered: 0 }],
      badges: [
        { id: 'test', name: 'Test Badge', earned: true, image: '/badges/default.png', description: 'Badge 1' }
      ],
    });
    await waitForBadgeState(page, 'test');
    await closeModalsIfOpen(page);
    await page.click('#profileBtn');
    await page.waitForSelector('[data-testid="profile-modal"]', { state: 'visible', timeout: 10000 });
    await page.getByTestId('analytics-btn').click();
    await page.waitForSelector('[data-testid="analytics-modal"]', { state: 'visible', timeout: 10000 });
    await page.click('[data-testid="analytics-modal"] [data-testid="close-btn"]');
    await page.waitForSelector('[data-testid="analytics-modal"]', { state: 'hidden', timeout: 3000 });
  });

  test('Analytics charts render and update with user actions', async ({ page }) => {
    await waitForAppReady(page);
    await waitForAppReady(page); // Ensure app is ready before setTestStateWithWait
    await setTestStateWithWait(page, {
      questions: [{
        id: 'q1',
        question: 'Sample?',
        correct: 0,
        answered: 0,
        topic: 'Test',
      }]
    });
    await expect(page.locator('[data-testid="open-analytics-btn"]').first()).toBeVisible();
    await page.locator('[data-testid="open-analytics-btn"]').first().click();
    await expect(page.getByRole('img', { name: 'Quiz Accuracy Chart' })).toBeVisible();

    // Set empty questions, check accuracy chart
    await page.waitForFunction(() => !!window.__E2E_HOOK_ATTACHED);
    await waitForAppReady(page); // Ensure app is ready before setTestStateWithWait
    await setTestStateWithWait(page, { questions: [] });
    await expect(page.getByTestId('accuracy-chart')).toBeVisible();

    // Set partial data, check chart updates
    await page.waitForFunction(() => !!window.__E2E_HOOK_ATTACHED);
    await waitForAppReady(page); // Ensure app is ready before setTestStateWithWait
    await setTestStateWithWait(page, { questions: [{question:'Q',answers:['A'],correct:0,answered:0}] });
    await expect(page.getByTestId('accuracy-chart')).toBeVisible();

    // Set full correct data, check chart updates
    await page.waitForFunction(() => !!window.__E2E_HOOK_ATTACHED);
    await waitForAppReady(page); // Ensure app is ready before setTestStateWithWait
    await setTestStateWithWait(page, { questions: Array(10).fill({question:'Q',answers:['A'],correct:1,answered:1}) });
    await expect(page.getByTestId('accuracy-chart')).toBeVisible();
  });

  test('Badge progress and analytics update after quiz completion', async ({ page }) => {
    await waitForAppReady(page);
    await closeModalsIfOpen(page);
    await waitForAppReady(page); // Ensure app is ready before setTestStateWithWait
    await setTestStateWithWait(page, {
      questions: [{ question: 'Q', answers: ['A'], correct: 0, answered: 0 }],
      badges: [{ id: 'test', name: 'Test Badge', earned: true, image: '/badges/default.png', description: 'E2E Test Badge' }],
    });
    await waitForBadgeState(page);
    await closeModalsIfOpen(page);
    await page.click('#profileBtn');
    await page.waitForSelector('[data-testid="profile-modal"]', { state: 'visible', timeout: 10000 }).catch(() => console.log('Timed out waiting for profile modal'));
    await page.waitForSelector('[data-testid="analytics-btn"]', { state: 'visible', timeout: 10000 });
    await expect(page.getByTestId('analytics-btn')).toBeVisible();
    await expect(page.getByTestId('analytics-btn')).toBeEnabled();
    await page.getByTestId('analytics-btn').click();
    await page.waitForSelector('[data-testid="analytics-modal"]', { state: 'visible', timeout: 10000 }).catch(() => console.log('Timed out waiting for analytics modal'));
    await expect(page.getByTestId('analytics-modal')).toBeVisible();
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
    await expect(page.locator('[data-testid="analytics-modal"] [data-testid="badge-earned-test"]')).toBeVisible();
  });

  test('Analytics and badges persist after reload', async ({ page }) => {
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
    await closeModalsIfOpen(page);
    await waitForAppReady(page); // Ensure app is ready before setTestStateWithWait
    await setTestStateWithWait(page, {
      questions: [{ question: 'Q', answers: ['A'], correct: 0, answered: 0 }],
      badges: [{ id: 'test', name: 'Test Badge', earned: true, image: '/badges/default.png', description: 'E2E Test Badge' }],
    });
    await page.reload();
    await waitForAppReady(page);
    await waitForAppReady(page); // Ensure app is ready before setTestStateWithWait after reload
    await setTestStateWithWait(page, {
      questions: [{ question: 'Q', answers: ['A'], correct: 0, answered: 0 }],
      badges: [{ id: 'test', name: 'Test Badge', earned: true, image: '/badges/default.png', description: 'E2E Test Badge' }],
    });
    // --- Force badge context sync after reload and state injection ---
    await page.evaluate(() => { if (typeof window.__SYNC_BADGES__ === 'function') window.__SYNC_BADGES__(); });
    await waitForBadgeState(page);
    const appStateBadges = await page.evaluate(() => (window.appState && window.appState.badges) ? JSON.stringify(window.appState.badges) : 'no appState.badges');
    console.log('window.appState.badges AFTER RELOAD:', appStateBadges);
    await closeModalsIfOpen(page);
    await page.click('#profileBtn');
    await page.waitForSelector('[data-testid="profile-modal"]', { state: 'visible', timeout: 10000 }).catch(() => console.log('Timed out waiting for profile modal'));
    await page.waitForSelector('[data-testid="analytics-btn"]', { state: 'visible', timeout: 10000 });
    await expect(page.getByTestId('analytics-btn')).toBeVisible();
    await expect(page.getByTestId('analytics-btn')).toBeEnabled();
    await page.getByTestId('analytics-btn').click();
    await expect(page.getByTestId('analytics-modal')).toBeVisible();
    await page.screenshot({ path: 'test-results/after-analytics-modal-reload.png', fullPage: true });
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="analytics-modal"] [data-testid="badge-debug-json-analytics"]');
      return el && el.textContent && el.textContent.includes('test');
    }, { timeout: 10000 }).catch(() => console.log('Timed out waiting for badge debug JSON to be non-null'));
    const debugJson = await page.locator('[data-testid="analytics-modal"] [data-testid="badge-debug-json-analytics"]').textContent().catch(() => null);
    console.log('BADGE DEBUG JSON AFTER RELOAD:', debugJson);
    const appState = await page.evaluate(() => (window as { appState?: unknown }).appState);
    let badges = null;
    try {
      badges = await page.evaluate(() => JSON.stringify((window as { badges?: unknown }).badges));
    } catch {
      badges = 'window.badges not defined';
    }
    console.log('WINDOW APPSTATE AFTER RELOAD:', appState);
    console.log('WINDOW BADGES AFTER RELOAD:', badges);
    const modalHtml = await page.locator('[data-testid="analytics-modal"]').innerHTML().catch(() => null);
    console.log('ANALYTICS MODAL HTML AFTER RELOAD:', modalHtml);
    await expect(page.getByTestId('accuracy-chart')).toBeVisible();
    await expect(page.locator('[data-testid="analytics-modal"] [data-testid="badge-earned-test"]')).toBeVisible();
  });

  test('Analytics modal and badge panel are accessible and display correct data', async ({ page }) => {
    await waitForAppReady(page);
    await waitForAppReady(page); // Ensure app is ready before setTestStateWithWait
    await setTestStateWithWait(page, {
      questions: [{ question: 'Q', answers: ['A'], correct: 0, answered: 0 }],
      badges: [{ id: 'test', name: 'Test Badge', earned: true, image: '/badges/default.png', description: 'E2E Test Badge' }],
    });
    // Open the Profile modal before checking for analytics button
    await openModalAndWaitForBadge(
      page,
      async () => { await page.click('#profileBtn'); await page.waitForSelector('[data-testid="profile-modal"]', { state: 'visible', timeout: 10000 }); await page.getByTestId('analytics-btn').click(); },
      '[data-testid="analytics-modal"]',
      '[data-testid="analytics-modal"] [data-testid="badge-earned-test"]',
      'analytics-modal'
    );
    await expect(page.getByTestId('analytics-modal')).toBeVisible();
    await expect(page.getByTestId('badge-progress-list-analytics')).toBeVisible();
  });
});
