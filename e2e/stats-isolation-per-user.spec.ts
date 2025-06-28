import { test, expect, Page } from '@playwright/test';
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

test.describe('Stats Isolation per User', () => {
  test('stats should not leak between users', async ({ page }) => {
    // User A: sign in, get initial stat, take a quiz
    await uiSignIn(page, USER_A);
    await page.goto('/analytics');
    let initialA = '';
    for (let i = 0; i < 10; i++) {
      initialA = await getStatValue(page, 'Quizzes Taken:') || '';
      if (initialA) break;
      await page.waitForTimeout(500);
    }
    /* eslint-disable no-undef */
    console.log('User A initial stat:', initialA);
    /* eslint-enable no-undef */
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
    // Reload analytics and get updated stat for User A
    await page.goto('/analytics');
    await page.waitForTimeout(2000);
    let updatedA = '';
    for (let i = 0; i < 10; i++) {
      updatedA = await getStatValue(page, 'Quizzes Taken:') || '';
      if (updatedA) break;
      await page.waitForTimeout(500);
    }
    /* eslint-disable no-undef */
    console.log('User A updated stat:', updatedA);
    /* eslint-enable no-undef */
    const updatedAInt = parseInt(updatedA, 10) || 0;
    expect(updatedAInt).toBeGreaterThan(initialAInt);
    // Sign out User A
    await page.goto('/profile');
    await page.click('button[aria-label="Sign out"], button:has-text("Sign Out")');
    await page.waitForSelector('[data-testid="test-signin-email"]', { timeout: 10000 });
    // User B: sign in, check stat
    await uiSignIn(page, USER_B);
    await page.goto('/analytics');
    let initialB = '';
    for (let i = 0; i < 10; i++) {
      initialB = await getStatValue(page, 'Quizzes Taken:') || '';
      if (initialB) break;
      await page.waitForTimeout(500);
    }
    /* eslint-disable no-undef */
    console.log('User B stat:', initialB);
    /* eslint-enable no-undef */
    const initialBInt = parseInt(initialB, 10) || 0;
    // User B's stat should not have changed due to User A's quiz
    expect(initialBInt).toBeLessThanOrEqual(initialAInt);

    // Optionally: sign out and back in as User A to verify stats again
    await page.goto('/profile');
    await page.click('button[aria-label="Sign out"], button:has-text("Sign Out")');
    await page.waitForSelector('[data-testid="test-signin-email"]', { timeout: 10000 });
    await uiSignIn(page, USER_A);
    await page.goto('/analytics');
    let finalA = '';
    for (let i = 0; i < 10; i++) {
      finalA = await getStatValue(page, 'Quizzes Taken:') || '';
      if (finalA) break;
      await page.waitForTimeout(500);
    }
    /* eslint-disable no-undef */
    console.log('User A final stat:', finalA);
    /* eslint-enable no-undef */
    const finalAInt = parseInt(finalA, 10) || 0;
    expect(finalAInt).toBe(updatedAInt);
  });
});
