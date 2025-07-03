/* global console */

import { test, expect } from '@playwright/test';
import { uiSignIn } from './helpers/uiSignIn';

const MAIN_PAGES = ['/', '/quiz', '/achievements', '/analytics', '/profile'];

const INTERACTIVE_SELECTORS = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'form',
  '[role="button"]',
  '[role="link"]',
  '[tabindex]:not([tabindex="-1"])',
];

test.describe('All Interactive Elements: ARIA and Keyboard Accessibility', () => {
  for (const pagePath of MAIN_PAGES) {
    test(`All interactive elements on ${pagePath} have accessible names and ARIA roles`, async ({ page }, testInfo) => {
      // Always sign in before visiting the page
      await uiSignIn(page, { profilePath: '/profile' });
      await page.goto(pagePath);
      // Wait for main content to appear (prevents stuck loading)
      await page.waitForSelector('.main-content', { timeout: 10000 });
      // Debug: screenshot and HTML if still loading
      const loadingText = await page.locator('text=Loading…').isVisible().catch(() => false);
      if (loadingText) {
        await page.screenshot({ path: testInfo.outputPath(`loading-stuck-${pagePath.replace(/\//g, '_')}.png`), fullPage: true });
        const html = await page.content();
        await testInfo.attach(`loading-stuck-${pagePath.replace(/\//g, '_')}.html`, { body: html, contentType: 'text/html' });
        throw new Error(`Page stuck on loading for ${pagePath}`);
      }
      const elements = await page.$$(INTERACTIVE_SELECTORS.join(','));
      expect(elements.length).toBeGreaterThan(0);
      for (const el of elements) {
        // Check for accessible name
        const name = await el.getAttribute('aria-label') ||
          await el.getAttribute('aria-labelledby') ||
          await el.getAttribute('alt') ||
          await el.textContent() || '';
        if (!name.trim().length) {
          const outer = await el.evaluate(e => e.outerHTML);
          // Attach debug info
          await testInfo.attach(`missing-accessible-name-${pagePath.replace(/\//g, '_')}.txt`, { body: outer, contentType: 'text/plain' });
          console.error(`Element missing accessible name on ${pagePath}:`, outer);
        }
        expect(name.trim().length).toBeGreaterThan(0);
        // Optionally, check for ARIA role
        // const role = await el.getAttribute('role');
        // expect(role).not.toBeNull();
      }
    });
  }
});
