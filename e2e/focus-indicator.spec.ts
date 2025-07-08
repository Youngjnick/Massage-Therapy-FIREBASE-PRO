/* global console */
import { test, expect } from '@playwright/test';
import './helpers/playwright-coverage';
import { uiSignIn } from './helpers/uiSignIn';
import fs from 'fs/promises';
import path from 'path';

const quizUrl = '/quiz?e2e=1';
const interactiveSelectors = [
  'button',
  'a',
  'input',
  'select',
  'textarea',
  '[tabindex]:not([tabindex="-1"])',
];

const __dirname = path.dirname(new URL(import.meta.url).pathname);
async function getTestUser(index = 0) {
  const usersPath = path.resolve(__dirname, 'test-users.json');
  const usersRaw = await fs.readFile(usersPath, 'utf-8');
  const users = JSON.parse(usersRaw);
  return users[index];
}

test.use({ viewport: { width: 375, height: 812 } }); // iPhone X/11/12/13/14 size

test.describe('Mobile Accessibility: Focus Indicator on Quiz', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.context().clearCookies();
    await page.reload();
  });
  test('Tabs through all interactive elements and checks visible focus indicator', async ({ page }, testInfo) => {
    await page.goto(quizUrl);
    // Wait for loading spinner to disappear (if present)
    try {
      await page.waitForSelector('[data-testid="quiz-loading"]', { state: 'detached', timeout: 20000 });
    } catch {
      console.error('Quiz loading spinner did not disappear on mobile quiz. Page HTML:', await page.content());
      throw new Error('Quiz did not finish loading on mobile.');
    }
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
  test.beforeEach(async ({ page }) => {
    const user = await getTestUser(0);
    await uiSignIn(page, { email: user.email, password: user.password });
  });
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

test.describe('Mobile Accessibility: Focus Indicator on Analytics', () => {
  test.beforeEach(async ({ page }) => {
    const user = await getTestUser(0);
    await uiSignIn(page, { email: user.email, password: user.password });
  });
  test('Tabs through all interactive elements and checks visible focus indicator', async ({ page }, testInfo) => {
    await page.goto('/analytics');
    await page.waitForSelector('h1, [data-page="analytics"], main, [aria-label*="Analytics"]', { timeout: 10000 });
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

test.describe('Mobile Accessibility: Focus Indicator on Profile', () => {
  test.beforeEach(async ({ page }) => {
    const user = await getTestUser(0);
    await uiSignIn(page, { email: user.email, password: user.password });
  });
  test('Tabs through all interactive elements and checks visible focus indicator', async ({ page }, testInfo) => {
    await page.goto('/profile');
    await page.waitForSelector('[data-page="profile"], main, h1, [aria-label*="Profile"]', { timeout: 10000 });
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
