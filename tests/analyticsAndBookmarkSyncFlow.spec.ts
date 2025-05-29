// Playwright E2E: Analytics and Bookmark Firestore Sync & Persistence
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

test.describe('Analytics and Bookmark Firestore Sync', () => {
  test('Analytics and bookmarks sync to Firestore and persist after reload', async ({ page }) => {
    await mockAuth(page);
    await page.goto('http://localhost:1234');
    await page.waitForFunction(() => !!(window as any).__E2E_HOOK_ATTACHED);
    // Add a bookmark (assume first question is visible after quiz start)
    await page.waitForSelector('.control[data-topic]');
    await page.selectOption('.control[data-topic]', { index: 1 });
    await page.selectOption('.control[data-quiz-length]', { value: '5' });
    await page.click('.start-btn');
    await page.waitForSelector('.quiz-card');
    // Bookmark first question
    await page.click('.bookmark-btn');
    // Answer first question
    await page.waitForSelector('.answer-btn');
    await page.click('.answer-btn');
    await page.waitForSelector('.next-btn');
    await page.click('.next-btn');

    // Debug: log window state after quiz actions
    const appState = await page.evaluate(() => JSON.stringify((window as any).appState));
    console.log('window.appState after quiz actions:', appState);
    let badges = null;
    try {
      badges = await page.evaluate(() => JSON.stringify((window as any).badges));
    } catch (e) {
      badges = 'window.badges not defined';
    }
    console.log('window.badges after quiz actions:', badges);
    const setTestStateType = await page.evaluate(() => typeof (window as any).setTestState);
    console.log('typeof window.setTestState:', setTestStateType);
    // Debug: log all visible buttons before analytics
    const visibleButtons = await page.$$eval('button, [role="button"]', btns => btns.map(b => b.textContent));
    console.log('VISIBLE BUTTONS BEFORE ANALYTICS:', visibleButtons);

    // Open analytics modal and check stats
    await page.getByTestId('analytics-btn').click();
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
    const statsText1 = await page.getByTestId('analytics-modal').innerText();
    expect(statsText1).toContain('Total Questions: 5');
    await expect(page.getByTestId('accuracy-chart')).toBeVisible();
    await page.getByTestId('close-analytics-modal').click();

    // Reload and sign in again
    await page.reload();
    await mockAuth(page);
    await page.goto('http://localhost:1234');
    // Wait for bookmarks to load
    await page.waitForTimeout(1000);
    // Open bookmarks sidebar and check bookmark is present
    await page.click('.bookmarks-sidebar-btn');
    await expect(page.locator('.bookmarked-question')).toBeVisible();
    // Open analytics modal and check stats again
    await page.getByTestId('analytics-btn').click();
    await expect(page.getByTestId('analytics-modal')).toBeVisible();
    const statsText2 = await page.getByTestId('analytics-modal').innerText();
    expect(statsText2).toContain('Total Questions: 5');
    await expect(page.getByTestId('accuracy-chart')).toBeVisible();
  });
});
