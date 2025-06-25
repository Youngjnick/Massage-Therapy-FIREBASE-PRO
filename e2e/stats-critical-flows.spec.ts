import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'test1234@gmail.com';
const TEST_PASSWORD = 'test1234';
const EMAIL_SELECTOR = '[data-testid="test-signin-email"]';
const PASSWORD_SELECTOR = '[data-testid="test-signin-password"]';
const SUBMIT_SELECTOR = '[data-testid="test-signin-submit"]';
const SIGNOUT_SELECTOR = 'button[aria-label="Sign out"], button:has-text("Sign Out")';

async function uiSignIn(page: import('@playwright/test').Page) {
  await page.goto('/profile');
  await page.fill(EMAIL_SELECTOR, TEST_EMAIL);
  await page.fill(PASSWORD_SELECTOR, TEST_PASSWORD);
  await page.click(SUBMIT_SELECTOR);
  await page.waitForSelector(SIGNOUT_SELECTOR, { timeout: 10000 });
}

async function getStatValue(page: import('@playwright/test').Page, label: string): Promise<string> {
  const statLocator = page.locator(`strong:text-is('${label}')`);
  const statCount = await statLocator.count();
  if (statCount === 0) return '';
  const parent = await statLocator.first().evaluateHandle(el => el.parentElement);
  if (parent) {
    const value = await parent.evaluate((parentEl, labelText) => {
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

test.describe('Stats Critical Flows', () => {
  test('should increment Quizzes Taken after each quiz', async ({ page }) => {
    await uiSignIn(page);
    await page.goto('/analytics');
    // Get initial stat
    let initialQuizzesTaken = '';
    for (let i = 0; i < 10; i++) {
      initialQuizzesTaken = await getStatValue(page, 'Quizzes Taken:') || '';
      if (initialQuizzesTaken) break;
      await page.waitForTimeout(500);
    }
    const initial = parseInt(initialQuizzesTaken, 10) || 0;
    // Take two quizzes
    for (let quizNum = 0; quizNum < 2; quizNum++) {
      await page.goto('/quiz');
      await page.waitForSelector('[data-testid="quiz-start-form"]', { timeout: 10000 });
      await page.getByLabel('Quiz Length').fill('1');
      await page.getByRole('button', { name: /start/i }).click();
      await page.waitForSelector('[data-testid="quiz-question-card"]', { timeout: 10000 });
      await page.getByTestId('quiz-option').first().click();
      await page.getByRole('button', { name: /next|finish/i }).click();
      await expect(page.getByTestId('quiz-results')).toBeVisible();
    }
    // Reload analytics and check stat
    await page.goto('/analytics');
    await page.waitForTimeout(2000);
    let updatedQuizzesTaken = '';
    for (let i = 0; i < 10; i++) {
      updatedQuizzesTaken = await getStatValue(page, 'Quizzes Taken:') || '';
      if (updatedQuizzesTaken) break;
      await page.waitForTimeout(500);
    }
    const updated = parseInt(updatedQuizzesTaken, 10) || 0;
    expect(updated).toBeGreaterThanOrEqual(initial + 2);
  });
});
