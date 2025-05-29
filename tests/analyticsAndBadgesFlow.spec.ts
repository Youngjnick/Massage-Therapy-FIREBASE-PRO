import { test, expect, Page } from '@playwright/test';

// Helper to set mock auth before each test
async function mockAuth(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
      email: 'testuser@gmail.com',
      name: 'Test User',
      uid: 'mock-uid-123',
    }));
  });
}

test.describe('Analytics and Badges E2E', () => {
  test('Analytics charts render and update with user actions', async ({ page }) => {
    await mockAuth(page);
    await page.goto('http://localhost:1234');
    await page.waitForFunction(() => !!(window as any).__E2E_HOOK_ATTACHED, { timeout: 20000 });

    // Set empty questions, check accuracy chart
    await page.evaluate(() => window.setTestState({ questions: [] }));
    await expect(page.getByTestId('accuracy-chart')).toBeVisible();

    // Set partial data, check chart updates
    await page.evaluate(() => window.setTestState({ questions: [{question:'Q',answers:['A'],correct:0,answered:0}] }));
    await expect(page.getByTestId('accuracy-chart')).toBeVisible();

    // Set full correct data, check chart updates
    await page.evaluate(() => window.setTestState({ questions: Array(10).fill({question:'Q',answers:['A'],correct:1,answered:1}) }));
    await expect(page.getByTestId('accuracy-chart')).toBeVisible();
  });

  test('Badge progress and analytics update after quiz completion', async ({ page }) => {
    await mockAuth(page);
    await page.goto('http://localhost:1234');
    await page.waitForFunction(() => !!(window as any).__E2E_HOOK_ATTACHED);
    await page.evaluate(() => {
      window.setTestState({ quizResults: [{score:10,total:10,date:Date.now()}] });
      (window as any).appState = (window as any).appState || {};
      (window as any).appState.badges = [{id:'test', earned:true}];
      window.dispatchEvent(new Event('testStateChanged'));
    });
    // Open analytics modal
    await page.getByTestId('analytics-btn').click();
    await expect(page.getByTestId('analytics-modal')).toBeVisible();
    // Debug: take a screenshot after modal opens
    await page.screenshot({ path: 'test-results/after-analytics-modal-open.png', fullPage: true });
    // Debug: log analytics modal HTML
    const modalHtml = await page.locator('[data-testid="analytics-modal"]').evaluate(el => el ? el.innerHTML : null).catch(() => null);
    console.log('ANALYTICS MODAL HTML:', modalHtml);
    // Debug: log badge debug JSON if present, and wait for it to be non-null
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="analytics-modal"] [data-testid="badge-debug-json-analytics"]');
      return el && el.textContent && el.textContent !== 'null';
    }, { timeout: 10000 }).catch(() => console.log('Timed out waiting for badge debug JSON to be non-null'));
    const debugJson = await page.locator('[data-testid="analytics-modal"] [data-testid="badge-debug-json-analytics"]').textContent().catch(() => null);
    console.log('BADGE DEBUG JSON:', debugJson);
    // Debug: log all badge-earned-test elements
    const badgeEarnedEls = await page.$$eval('[data-testid="analytics-modal"] [data-testid^="badge-earned-"]', els => els.map(e => e.outerHTML));
    console.log('BADGE-EARNED ELEMENTS:', badgeEarnedEls);
    await page.waitForFunction(() => !!document.querySelector('[data-testid="analytics-modal"] [data-testid="badge-earned-test"]'));
    await expect(page.locator('[data-testid="analytics-modal"] [data-testid="badge-earned-test"]')).toBeVisible();
  });

  test('Analytics and badges persist after reload', async ({ page }) => {
    await mockAuth(page);
    await page.goto('http://localhost:1234');
    await page.waitForFunction(() => !!(window as any).__E2E_HOOK_ATTACHED);
    await page.evaluate(() => {
      window.setTestState({ badges: [{id:'test',earned:true}], questions: Array(5).fill({question:'Q',answers:['A'],correct:1,answered:1}) });
      window.dispatchEvent(new Event('testStateChanged'));
    });
    await page.reload();
    await page.waitForFunction(() => !!(window as any).__E2E_HOOK_ATTACHED);
    // Open analytics modal after reload
    await page.getByTestId('analytics-btn').click();
    await expect(page.getByTestId('analytics-modal')).toBeVisible();
    // Debug: take a screenshot after opening modal
    await page.screenshot({ path: 'test-results/after-analytics-modal-reload.png', fullPage: true });
    // Debug: log badge debug JSON if present, and wait for it to be non-null
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="analytics-modal"] [data-testid="badge-debug-json-analytics"]');
      return el && el.textContent && el.textContent !== 'null';
    }, { timeout: 10000 }).catch(() => console.log('Timed out waiting for badge debug JSON to be non-null'));
    const debugJson = await page.locator('[data-testid="analytics-modal"] [data-testid="badge-debug-json-analytics"]').textContent().catch(() => null);
    console.log('BADGE DEBUG JSON AFTER RELOAD:', debugJson);
    // Debug: log appState and badges from window
    const appState = await page.evaluate(() => (window as any).appState);
    let badges = null;
    try {
      badges = await page.evaluate(() => JSON.stringify((window as any).badges));
    } catch (e) {
      badges = 'window.badges not defined';
    }
    console.log('WINDOW APPSTATE AFTER RELOAD:', appState);
    console.log('WINDOW BADGES AFTER RELOAD:', badges);
    // Debug: log modal HTML
    const modalHtml = await page.locator('[data-testid="analytics-modal"]').innerHTML().catch(() => null);
    console.log('ANALYTICS MODAL HTML AFTER RELOAD:', modalHtml);
    await expect(page.getByTestId('accuracy-chart')).toBeVisible();
    await expect(page.locator('[data-testid="analytics-modal"] [data-testid="badge-earned-test"]')).toBeVisible();
  });

  test('Analytics modal and badge panel are accessible and display correct data', async ({ page }) => {
    await mockAuth(page);
    await page.goto('http://localhost:1234');
    await page.waitForFunction(() => !!(window as any).__E2E_HOOK_ATTACHED);
    await page.getByTestId('analytics-btn').click();
    await expect(page.getByTestId('analytics-modal')).toBeVisible();
    await expect(page.getByTestId('badge-progress-list-analytics')).toBeVisible();
  });
});
