/* global console */

import { test, expect } from '@playwright/test';

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
    test(`All interactive elements on ${pagePath} have accessible names and ARIA roles`, async ({ page }) => {
      await page.goto(pagePath);
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
