import { test, expect } from '@playwright/test';

const quizUrl = '/quiz?e2e=1';
const interactiveSelectors = [
  'button',
  'a',
  'input',
  'select',
  'textarea',
  '[tabindex]:not([tabindex="-1"])',
];

test.use({ viewport: { width: 375, height: 812 } }); // iPhone X/11/12/13/14 size

test.describe('Mobile Accessibility: Focus Indicator on Quiz', () => {
  test('Tabs through all interactive elements and checks visible focus indicator', async ({ page }, testInfo) => {
    await page.goto(quizUrl);
    await page.waitForSelector('form', { timeout: 10000 });
    // Get all potentially interactive elements
    const allHandles = await page.$$(interactiveSelectors.join(','));
    // Filter only truly tabbable elements
    const tabbableHandles = [];
    for (const handle of allHandles) {
      const isTabbable = await handle.evaluate((node) => {
        const style = window.getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden' || node.hasAttribute('disabled') || node.getAttribute('aria-hidden') === 'true') return false;
        if (node.tabIndex === -1) return false;
        if (node.tagName === 'A' && !node.hasAttribute('href')) return false;
        const rect = node.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        return true;
      });
      if (isTabbable) tabbableHandles.push(handle);
    }
    expect(tabbableHandles.length).toBeGreaterThan(0);
    // Focus and tab through each tabbable element
    for (let idx = 0; idx < tabbableHandles.length; idx++) {
      const el = tabbableHandles[idx];
      if (idx === 0) {
        await el.focus();
      } else {
        await page.keyboard.press('Tab');
      }
      // Wait for focus
      let focused = false;
      for (let retry = 0; retry < 5; retry++) {
        if (await el.evaluate((node) => node === document.activeElement)) {
          focused = true;
          break;
        }
        await page.waitForTimeout(100);
      }
      if (!focused) {
        const tag = await el.evaluate((node) => node.tagName + (node.id ? `#${node.id}` : ''));
        testInfo.annotations.push({ type: 'warning', description: `Skipped non-focusable element at index ${idx}: ${tag}` });
        continue;
      }
      // Only check for visible focus indicator if element is focused
      const style = await el.evaluate((node) => {
        const s = window.getComputedStyle(node);
        return {
          outline: s.outlineStyle !== 'none' && s.outlineWidth !== '0px',
          boxShadow: !!s.boxShadow && s.boxShadow !== 'none',
        };
      });
      expect(style.outline || style.boxShadow).toBeTruthy();
    }
  });
});

test.describe('Mobile Accessibility: Focus Indicator on Achievements', () => {
  test('Tabs through all interactive elements and checks visible focus indicator', async ({ page }, testInfo) => {
    await page.goto('/achievements');
    await page.waitForSelector('[data-page="achievements"], main, h1, [aria-label*="Achievements"]', { timeout: 10000 });
    // Get all potentially interactive elements
    const allHandles = await page.$$(interactiveSelectors.join(','));
    // Filter only truly tabbable elements
    const tabbableHandles = [];
    for (const handle of allHandles) {
      const isTabbable = await handle.evaluate((node) => {
        const style = window.getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden' || node.hasAttribute('disabled') || node.getAttribute('aria-hidden') === 'true') return false;
        if (node.tabIndex === -1) return false;
        if (node.tagName === 'A' && !node.hasAttribute('href')) return false;
        const rect = node.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        return true;
      });
      if (isTabbable) tabbableHandles.push(handle);
    }
    expect(tabbableHandles.length).toBeGreaterThan(0);
    // Focus and tab through each tabbable element
    for (let idx = 0; idx < tabbableHandles.length; idx++) {
      const el = tabbableHandles[idx];
      if (idx === 0) {
        await el.focus();
      } else {
        await page.keyboard.press('Tab');
      }
      // Wait for focus
      let focused = false;
      for (let retry = 0; retry < 5; retry++) {
        if (await el.evaluate((node) => node === document.activeElement)) {
          focused = true;
          break;
        }
        await page.waitForTimeout(100);
      }
      if (!focused) {
        const tag = await el.evaluate((node) => node.tagName + (node.id ? `#${node.id}` : ''));
        testInfo.annotations.push({ type: 'warning', description: `Skipped non-focusable element at index ${idx}: ${tag}` });
        continue;
      }
      // Only check for visible focus indicator if element is focused
      const style = await el.evaluate((node) => {
        const s = window.getComputedStyle(node);
        return {
          outline: s.outlineStyle !== 'none' && s.outlineWidth !== '0px',
          boxShadow: !!s.boxShadow && s.boxShadow !== 'none',
        };
      });
      expect(style.outline || style.boxShadow).toBeTruthy();
    }
  });
});
