// tests/analyticsFlicker.spec.ts
// Playwright E2E test: Ensures analytics panel and charts do not flicker or disappear
// Run with: npx playwright test tests/analyticsFlicker.spec.ts

import { test, expect, Page } from '@playwright/test';

test.describe('Analytics Flicker', () => {
  test('Analytics panel and charts remain visible and stable', async ({ page }) => {
    // Remove or comment out any sign-in UI steps, such as:
    // await page.fill('input[type="email"]', 'testuser@gmail.com');
    // await page.fill('input[type="password"]', 'testpassword123!');
    // await page.click('button[type="submit"]');
    
    await page.goto('http://localhost:1234');
    // Debug: log all visible buttons before analytics
    const visibleButtons = await page.$$eval('button, [role="button"]', btns => btns.map(b => b.textContent));
    console.log('VISIBLE BUTTONS BEFORE ANALYTICS:', visibleButtons);
    // Wait for analytics panel and chart canvases to appear
    await expect(page.locator('#debug-panel')).toBeVisible();
    await expect(page.locator('#badge-progress-list')).toBeVisible();
    // Debug: log window state after panel appears
    const appState = await page.evaluate(() => JSON.stringify((window as any).appState));
    console.log('window.appState after panel appears:', appState);
    let badges = null;
    try {
      badges = await page.evaluate(() => JSON.stringify((window as any).badges));
    } catch (e) {
      badges = 'window.badges not defined';
    }
    console.log('window.badges after panel appears:', badges);
    const setTestStateType = await page.evaluate(() => typeof (window as any).setTestState);
    console.log('typeof window.setTestState:', setTestStateType);
    // Wait for charts to render
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
