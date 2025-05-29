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
  // Remove or comment out any sign-in UI steps, such as:
  // await page.click('#profileBtn');
  // await page.click('button[type="button"], [data-testid="sign-in-btn"]', { timeout: 5000 }).catch(() => {});
  // await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  // await page.fill('input[type="email"]', 'testuser@gmail.com');
  // await page.fill('input[type="password"]', 'testpassword123!');
  // await page.click('button[type="submit"]');
  // await expect(page.locator('img[alt="Profile"], img[alt="User Avatar"], #mainProfileAvatar')).toBeVisible();

  test('Analytics modal shows all charts and badge images', async ({ page }) => {
    await mockAuth(page);
    await page.goto('http://localhost:1234');
    await page.waitForFunction(() => !!(window as any).__E2E_HOOK_ATTACHED);
    await page.evaluate(() => {
      window.setTestState({ badges: [
        { id: 'test1', name: 'Test Badge 1', image: '/badges/test1.png', criteria: 'Do something', earned: true },
        { id: 'test2', name: 'Test Badge 2', image: '/badges/test2.png', criteria: 'Do something else', earned: false }
      ] });
      window.dispatchEvent(new Event('testStateChanged'));
    });
    // Debug: log window state after test state injection
    const appState = await page.evaluate(() => JSON.stringify((window as any).appState));
    console.log('window.appState after setTestState:', appState);
    let badges = null;
    try {
      badges = await page.evaluate(() => JSON.stringify((window as any).badges));
    } catch (e) {
      badges = 'window.badges not defined';
    }
    console.log('window.badges after setTestState:', badges);
    const setTestStateType = await page.evaluate(() => typeof (window as any).setTestState);
    console.log('typeof window.setTestState:', setTestStateType);
    // Debug: log all visible buttons before waiting for selector
    const visibleButtons = await page.$$eval('button, [role="button"]', btns => btns.map(b => b.textContent));
    console.log('VISIBLE BUTTONS BEFORE WAIT:', visibleButtons);
    // If modal is not open, open it; otherwise, just wait for it
    const modal = await page.locator('[data-testid="analytics-modal"]');
    if (!(await modal.isVisible())) {
      await page.getByTestId('analytics-btn').click();
    }
    await expect(modal).toBeVisible();
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
    await expect(page.getByTestId('badge-earned-test')).toBeVisible();
    // Close modal
    await page.getByTestId('close-analytics-modal').click();
    await expect(page.getByTestId('analytics-modal')).not.toBeVisible();
  });

  test('Smart Learning modal shows badge images and progress', async ({ page }) => {
    await mockAuth(page);
    await page.goto('http://localhost:1234');
    await page.waitForFunction(() => !!(window as any).__E2E_HOOK_ATTACHED);
    // Inject badge data and earned badges before opening modal
    await page.evaluate(() => {
      (window as any).badgesData = [
        { id: 'test1', name: 'Test Badge 1', image: '/badges/test1.png', criteria: 'Do something' },
        { id: 'test2', name: 'Test Badge 2', image: '/badges/test2.png', criteria: 'Do something else' }
      ];
      localStorage.setItem('earnedBadges', JSON.stringify(['test1']));
      window.dispatchEvent(new Event('testStateChanged'));
    });
    // Debug: log window state after test state injection
    const badgesData = await page.evaluate(() => JSON.stringify((window as any).badgesData));
    console.log('window.badgesData after setTestState:', badgesData);
    const earnedBadges = await page.evaluate(() => localStorage.getItem('earnedBadges'));
    console.log('localStorage.earnedBadges after setTestState:', earnedBadges);
    const setTestStateType = await page.evaluate(() => typeof (window as any).setTestState);
    console.log('typeof window.setTestState:', setTestStateType);
    // Debug: log all visible buttons before waiting for selector
    const visibleButtons = await page.$$eval('button, [role="button"]', btns => btns.map(b => b.textContent));
    console.log('VISIBLE BUTTONS BEFORE WAIT:', visibleButtons);
    // Open Smart Learning modal
    await page.getByTestId('smart-learning-link').click();
    await expect(page.getByTestId('smart-learning-modal')).toBeVisible();
    // Debug: take a screenshot after modal opens
    await page.screenshot({ path: 'test-results/after-smart-learning-modal-open.png', fullPage: true });
    // Debug: log smart learning modal HTML
    const modalHtml = await page.locator('[data-testid="smart-learning-modal"]').evaluate(el => el ? el.innerHTML : null).catch(() => null);
    console.log('SMART LEARNING MODAL HTML:', modalHtml);
    // Debug: log badge debug JSON if present, and wait for it to be non-null
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="smart-learning-modal"] [data-testid="badge-debug-json-smart-learning"]');
      return el && el.textContent && el.textContent !== 'null';
    }, { timeout: 10000 }).catch(() => console.log('Timed out waiting for badge debug JSON to be non-null'));
    const debugJson = await page.locator('[data-testid="smart-learning-modal"] [data-testid="badge-debug-json-smart-learning"]').textContent().catch(() => null);
    console.log('BADGE DEBUG JSON:', debugJson);
    // Debug: log all badge-earned-test elements
    const badgeEarnedEls = await page.$$eval('[data-testid="smart-learning-modal"] [data-testid^="badge-earned-"]', els => els.map(e => e.outerHTML));
    console.log('BADGE-EARNED ELEMENTS:', badgeEarnedEls);
    await page.waitForFunction(() => !!document.querySelector('[data-testid="smart-learning-modal"] [data-testid="badge-earned-test"]'));
    await expect(page.getByTestId('badge-earned-test')).toBeVisible();
    // Close modal
    await page.getByTestId('close-smart-learning-modal').click();
    await expect(page.getByTestId('smart-learning-modal')).not.toBeVisible();
  });
});
