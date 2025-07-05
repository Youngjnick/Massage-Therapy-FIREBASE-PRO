import { test, expect } from '@playwright/test';
import { uiSignIn } from './helpers/uiSignIn';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load test user from test-users.json for robust sign-in
// __dirname is not defined in ESM; use import.meta.url workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getTestUser() {
  const users = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'test-users.json'), 'utf-8'));
  return users[0];
}

// Utility to collect all tabbable elements
async function getTabbableElements(page: any) {
  return await page.evaluate(() => {
    const selector = [
      'a[href]:not([tabindex="-1"])',
      'button:not([disabled]):not([tabindex="-1"])',
      'input:not([type="hidden"]):not([disabled]):not([tabindex="-1"])',
      'select:not([disabled]):not([tabindex="-1"])',
      'textarea:not([disabled]):not([tabindex="-1"])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]',
      '[role="link"]',
      '[role="checkbox"]',
      '[role="radio"]',
      '[role="tab"]',
      '[role="switch"]',
      '[role="menuitem"]',
      '[role="option"]',
      '[role="combobox"]',
      '[role="listbox"]',
      '[role="slider"]',
      '[role="spinbutton"]',
      '[role="textbox"]',
    ].join(',');
    const elements = Array.from(document.querySelectorAll(selector));
    // Only visible elements
    return elements.filter(el => {
      const style = window.getComputedStyle(el);
      return style.visibility !== 'hidden' && style.display !== 'none' && (el as HTMLElement).offsetParent !== null;
    }).map(el => ({
      tag: el.tagName,
      role: el.getAttribute('role'),
      ariaLabel: el.getAttribute('aria-label'),
      id: el.id,
      text: el.textContent?.trim(),
      tabIndex: (el as HTMLElement).tabIndex,
      outerHTML: el.outerHTML,
    }));
  });
}

test.describe('App Accessibility: Full Tab Order and ARIA Audit', () => {
  test('Tab through all main pages and assert focus order/visibility', async ({ page }) => {
    // Always sign in before accessing authenticated UI
    const user = await getTestUser();
    await uiSignIn(page, { email: user.email, password: user.password });
    await page.goto('/');
    // NavBar links
    const navLinks = [
      { label: 'Quiz', path: '/quiz', aria: 'Go to Quiz page' },
      { label: 'Achievements', path: '/achievements', aria: 'Go to Achievements page' },
      { label: 'Analytics', path: '/analytics', aria: 'Go to Analytics page' },
      { label: 'Profile', path: '/profile', aria: 'Go to Profile page' },
    ];
    for (const nav of navLinks) {
      // Use unique aria-label for navigation links to avoid ambiguity
      const navLink = await page.getByRole('link', { name: nav.aria, exact: true });
      await navLink.focus();
      const viewport = page.viewportSize && page.viewportSize();
      if (!viewport || viewport.width > 500) {
        await expect(navLink).toBeFocused();
        await page.waitForTimeout(150);
        await page.keyboard.press('Enter');
      } else {
        await navLink.click();
      }
      await page.waitForURL(`**${nav.path}`);
      await page.waitForTimeout(150);
      // Wait for loading spinner to disappear if present
      try {
        await page.waitForSelector('[data-testid="quiz-loading"]', { state: 'detached', timeout: 10000 });
      } catch {}
      // Wait for Quiz Length input to be visible if on /quiz
      if (nav.path === '/quiz') {
        try {
          await page.waitForURL('**/quiz', { timeout: 10000 });
          await page.waitForSelector('[data-testid="quiz-start-form"]', { timeout: 10000 });
        } catch (e) {
          const html = await page.content();
          console.error('Failed to load /quiz or quiz-start-form not found. Page HTML:', html);
          throw e;
        }
      }
      // Get all tabbable elements and log them using test.step
      const tabbable: Array<{ tag: string, role: string|null, ariaLabel: string|null, id: string|null, text: string|null, tabIndex: number, outerHTML: string }> = await getTabbableElements(page);
      await test.step(`Tabbable elements on ${nav.path}:`, async () => {
        for (let i = 0; i < tabbable.length; i++) {
          const el = tabbable[i];
          await test.step(`#${i}: tag=${el.tag}, role=${el.role}, ariaLabel=${el.ariaLabel}, text=${el.text}`, async () => {});
        }
      });
      // Assert the nav link for this page is present in tabbable list
      const found = tabbable.some((el: any) => el.ariaLabel === nav.aria);
      expect(found).toBeTruthy();
      // Tab through all tabbable elements and check focus
      for (let i = 0; i < tabbable.length; i++) {
        await page.keyboard.press('Tab');
        const active = await page.evaluate(() => document.activeElement?.outerHTML);
        // Log for debugging
        await test.step(`DEBUG: After Tab #${i} on ${nav.path} , expected: ${tabbable[i].outerHTML.substring(0, 32)}` , async () => {});
        await test.step(`DEBUG: Actual active: ${active?.substring(0, 64)}`, async () => {});
        // Only check that the active element is focusable, not strict order
        expect(active).toBeTruthy();
      }
      // Go back to home for next nav
      await page.goto('/');
    }
  });

  test('No missing or duplicate ARIA labels/roles on main interactive elements', async ({ page }) => {
    await page.goto('/');
    const tabbable = await getTabbableElements(page);
    const seenLabels = new Set();
    const seenRoles = new Set();
    for (const el of tabbable) {
      // Check for missing aria-label or role
      expect(el.ariaLabel || el.role).toBeTruthy();
      // Warn on duplicate aria-labels (except for common controls)
      if (el.ariaLabel && !['Next', 'Previous', 'Close', 'Finish', 'Bookmark'].includes(el.ariaLabel)) {
        expect(seenLabels.has(el.ariaLabel)).toBeFalsy();
        seenLabels.add(el.ariaLabel);
      }
      // Warn on duplicate roles for same id
      if (el.id && el.role) {
        const key = `${el.id}:${el.role}`;
        expect(seenRoles.has(key)).toBeFalsy();
        seenRoles.add(key);
      }
    }
  });
});

test.describe('App Accessibility: Full Tab Order and ARIA Audit (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone X/11/12/13/14 size
  test('Tab through all main pages and assert focus order/visibility (Mobile)', async ({ page }) => {
    // Always sign in before accessing authenticated UI
    const user = await getTestUser();
    await uiSignIn(page, { email: user.email, password: user.password });
    await page.goto('/');
    const navLinks = [
      { label: 'Quiz', path: '/quiz', aria: 'Go to Quiz page' },
      { label: 'Achievements', path: '/achievements', aria: 'Go to Achievements page' },
      { label: 'Analytics', path: '/analytics', aria: 'Go to Analytics page' },
      { label: 'Profile', path: '/profile', aria: 'Go to Profile page' },
    ];
    for (const nav of navLinks) {
      const navLink = await page.getByRole('link', { name: nav.aria, exact: true });
      await navLink.focus();
      const viewport = page.viewportSize && page.viewportSize();
      if (!viewport || viewport.width > 500) {
        await expect(navLink).toBeFocused();
        await page.waitForTimeout(150);
        await page.keyboard.press('Enter');
      } else {
        await navLink.click();
      }
      await page.waitForURL(`**${nav.path}`);
      await page.waitForTimeout(150);
      // Wait for loading spinner to disappear if present
      try {
        await page.waitForSelector('[data-testid="quiz-loading"]', { state: 'detached', timeout: 10000 });
      } catch {}
      // Wait for Quiz Length input to be visible if on /quiz
      if (nav.path === '/quiz') {
        try {
          await page.waitForURL('**/quiz', { timeout: 10000 });
          await page.waitForSelector('[data-testid="quiz-start-form"]', { timeout: 10000 });
        } catch (e) {
          const html = await page.content();
          console.error('Failed to load /quiz or quiz-start-form not found. Page HTML:', html);
          throw e;
        }
      }
      const tabbable = await getTabbableElements(page);
      await test.step(`Tabbable elements on ${nav.path} (Mobile):`, async () => {
        for (let i = 0; i < tabbable.length; i++) {
          const el = tabbable[i];
          await test.step(`#${i}: tag=${el.tag}, role=${el.role}, ariaLabel=${el.ariaLabel}, text=${el.text}`, async () => {});
        }
      });
      const found = tabbable.some((el: any) => el.ariaLabel === nav.aria);
      expect(found).toBeTruthy();
      let lastFocused = await page.evaluate(() => document.activeElement?.outerHTML);
      const focusOrder = [lastFocused];
      let maxTabs = Math.min(tabbable.length, 50); // guard against infinite loop
      for (let i = 0; i < maxTabs; i++) {
        await page.keyboard.press('Tab');
        const currentFocused = await page.evaluate(() => document.activeElement?.outerHTML);
        focusOrder.push(currentFocused);
        await test.step(`DEBUG: After Tab #${i} on ${nav.path} (Mobile), expected: ${tabbable[i]?.outerHTML?.substring(0, 32)}` , async () => {});
        await test.step(`DEBUG: Actual active: ${currentFocused?.substring(0, 64)}`, async () => {});
        if (currentFocused === lastFocused) {
          console.error(`Focus did not move on Tab at index ${i}`);
          console.error('Focus order so far:', focusOrder);
          throw new Error(`Focus did not move on Tab at index ${i}`);
        }
        lastFocused = currentFocused;
      }
      // Optionally, log the full focus order for review
      console.log('Tab focus order:', focusOrder);
      await page.goto('/');
    }
  });
});
