import { test, expect, Page } from '@playwright/test';
// Ensure process is available for progress bar
import process from 'process';
import { uiSignIn } from './helpers/uiSignIn';

const USER_A = { email: 'testUserA@gmail.com', password: 'test1234' };
const USER_B = { email: 'testUserB@gmail.com', password: 'test1234' };

async function getStatValue(page: Page, label: string): Promise<string> {
  const statLocator = page.locator(`strong:text-is('${label}')`);
  const statCount = await statLocator.count();
  if (statCount === 0) return '';
  const parent = await statLocator.first().evaluateHandle((el: Element) => el.parentElement);
  if (parent) {
    const value = await parent.evaluate((parentEl: HTMLElement | null, labelText: string) => {
      if (!parentEl) return '';
      let found = false;
      const children = parentEl.childNodes;
      for (let i = 0; i < children.length; i++) {
        const node = children[i];
        if (found) {
          if (node.nodeType === Node.TEXT_NODE) {
            const txt = node.textContent?.trim();
            if (txt) return txt;
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const txt = (node as HTMLElement).innerText?.trim();
            if (txt) return txt;
          }
        }
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          (node as HTMLElement).tagName === 'STRONG' &&
          (node as HTMLElement).innerText.trim() === labelText
        ) {
          found = true;
        }
      }
      return '';
    }, label);
    return typeof value === 'string' ? value : '';
  }
  return '';
}

// Remove unused eslint-disable and use globalThis.console for Node.js context
const log = (...args: any[]) => {
  globalThis.console.log(...args);
};

test.describe('Stats Isolation per User', () => {
  test('stats should not leak between users', async ({ page }) => {
    // User A: sign in, get initial stat, take a quiz
    await uiSignIn(page, USER_A);
    // Print all localStorage keys/values immediately after sign-in for debug
    const allLocalStorage = await page.evaluate(() => {
      const out: Record<string, string> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) out[key] = window.localStorage.getItem(key) ?? '';
      }
      return out;
    });
    log('[E2E DEBUG] User A localStorage after sign-in:', JSON.stringify(allLocalStorage, null, 2));
    // Print all sessionStorage keys/values
    const allSessionStorage = await page.evaluate(() => {
      const out: Record<string, string> = {};
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key) out[key] = window.sessionStorage.getItem(key) ?? '';
      }
      return out;
    });
    log('[E2E DEBUG] User A sessionStorage after sign-in:', JSON.stringify(allSessionStorage, null, 2));
    // Print all cookies
    const cookies = await page.context().cookies();
    log('[E2E DEBUG] Cookies after sign-in:', JSON.stringify(cookies, null, 2));
    // Wait for mock UID to be set in localStorage after sign-in
    await page.waitForFunction(() => !!window.localStorage.getItem('testUid'), { timeout: 5000 });
    const userAId = await page.evaluate(() => window.localStorage.getItem('testUid'));
    log('User A UID:', userAId);
    log(
      '[E2E DEBUG] User A localStorage:',
      JSON.stringify(await page.evaluate(() => Object.fromEntries(Object.entries(window.localStorage).filter(([key]) => key !== 'null' && key !== ''))), null, 2)
    );
    await page.goto('/analytics');
    let initialA = '';
    for (let i = 0; i < 20; i++) {
      if (i === 0) process.stdout.write('Polling stat (User A initial): [');
      initialA = await getStatValue(page, 'Quizzes Taken:') || '';
      if (initialA) break;
      process.stdout.write('#');
      await page.waitForTimeout(500);
      if (i === 19) process.stdout.write('] (timeout)\n');
    }
    if (initialA) process.stdout.write(']\n');
    log('User A initial stat:', initialA);
    const initialAInt = parseInt(initialA, 10) || 0;
    // Take a quiz as User A
    await page.goto('/quiz');
    await page.waitForSelector('[data-testid="quiz-start-form"]', { timeout: 10000 });
    await page.getByLabel('Quiz Length').fill('1');
    await page.getByRole('button', { name: /start/i }).click();
    await page.waitForSelector('[data-testid="quiz-question-card"]', { timeout: 10000 });
    await page.getByTestId('quiz-option').first().click();
    await page.getByRole('button', { name: /next|finish/i }).click();
    await expect(page.getByTestId('quiz-results')).toBeVisible();
    // Wait for stats to update
    await page.waitForTimeout(3000);
    // Reload analytics and get updated stat for User A
    await page.goto('/analytics');
    await page.waitForTimeout(2000);
    let updatedA = '';
    for (let i = 0; i < 20; i++) {
      if (i === 0) process.stdout.write('Polling stat (User A updated): [');
      updatedA = await getStatValue(page, 'Quizzes Taken:') || '';
      if (updatedA) break;
      process.stdout.write('#');
      await page.waitForTimeout(500);
      if (i === 19) process.stdout.write('] (timeout)\n');
    }
    if (updatedA) process.stdout.write(']\n');
    log('User A updated stat:', updatedA);
    const updatedAInt = parseInt(updatedA, 10) || 0;
    expect(updatedAInt).toBeGreaterThan(initialAInt);
    // Sign out User A
    await page.goto('/profile');
    await page.click('button[aria-label="Sign out"], button:has-text("Sign Out")');
    await page.waitForSelector('[data-testid="test-signin-email"]', { timeout: 10000 });
    // User B: sign in, check stat
    await uiSignIn(page, USER_B);
    await page.waitForFunction(() => !!window.localStorage.getItem('testUid'), { timeout: 5000 });
    const userBId = await page.evaluate(() => window.localStorage.getItem('testUid'));
    log('User B UID:', userBId);
    log(
      '[E2E DEBUG] User B localStorage:',
      JSON.stringify(await page.evaluate(() => Object.fromEntries(Object.entries(window.localStorage).filter(([key]) => key !== 'null' && key !== ''))), null, 2)
    );
    await page.goto('/analytics');
    let initialB = '';
    for (let i = 0; i < 20; i++) {
      if (i === 0) process.stdout.write('Polling stat (User B initial): [');
      initialB = await getStatValue(page, 'Quizzes Taken:') || '';
      if (initialB) break;
      process.stdout.write('#');
      await page.waitForTimeout(500);
      if (i === 19) process.stdout.write('] (timeout)\n');
    }
    if (initialB) process.stdout.write(']\n');
    log('User B stat:', initialB);
    const initialBInt = parseInt(initialB, 10) || 0;
    // User B's stat should not have changed due to User A's quiz
    expect(initialBInt).toBeLessThanOrEqual(initialAInt);
    // Optionally: sign out and back in as User A to verify stats again
    await page.goto('/profile');
    await page.click('button[aria-label="Sign out"], button:has-text("Sign Out")');
    await page.waitForSelector('[data-testid="test-signin-email"]', { timeout: 10000 });
    await uiSignIn(page, USER_A);
    // Wait for mock UID to be set in localStorage after sign-in
    await page.waitForFunction(() => !!window.localStorage.getItem('testUid'), { timeout: 5000 });
    const userAId2 = await page.evaluate(() => window.localStorage.getItem('testUid'));
    log('User A UID after re-login:', userAId2);
    log(
      '[E2E DEBUG] User A localStorage after re-login:',
      JSON.stringify(await page.evaluate(() => Object.fromEntries(Object.entries(window.localStorage).filter(([key]) => key !== 'null' && key !== ''))), null, 2)
    );
    await page.goto('/analytics');
    let finalA = '';
    for (let i = 0; i < 20; i++) {
      if (i === 0) process.stdout.write('Polling stat (User A final): [');
      finalA = await getStatValue(page, 'Quizzes Taken:') || '';
      if (finalA) break;
      process.stdout.write('#');
      await page.waitForTimeout(500);
      if (i === 19) process.stdout.write('] (timeout)\n');
    }
    if (finalA) process.stdout.write(']\n');
    log('User A final stat:', finalA);
    const finalAInt = parseInt(finalA, 10) || 0;
    expect(finalAInt).toBe(updatedAInt);
  });
});
