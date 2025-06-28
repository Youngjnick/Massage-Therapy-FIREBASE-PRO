import { test, expect } from '@playwright/test';
import { uiSignIn } from './helpers/uiSignIn';

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

test.describe('Stats Persistence', () => {
  test('should persist updated stats after quiz and reload', async ({ page }) => {
    await uiSignIn(page);
    await page.goto('/analytics');
    // Wait for stat value to be non-empty
    let initialQuizzesTaken: string = '';
    for (let i = 0; i < 10; i++) {
      initialQuizzesTaken = await getStatValue(page, 'Quizzes Taken:') || '';
      if (initialQuizzesTaken) break;
      await page.waitForTimeout(500);
    }
    // Take a quiz
    await page.goto('/quiz');
    await page.waitForSelector('[data-testid="quiz-start-form"]', { timeout: 10000 });
    await page.getByLabel('Quiz Length').fill('1');
    await page.getByRole('button', { name: /start/i }).click();
    await page.waitForSelector('[data-testid="quiz-question-card"]', { timeout: 10000 });
    await page.getByTestId('quiz-option').first().click();
    await page.getByRole('button', { name: /next|finish/i }).click();
    await expect(page.getByTestId('quiz-results')).toBeVisible();
    // Reload analytics and check stats
    await page.goto('/analytics');
    await page.waitForTimeout(2000);
    let updatedQuizzesTaken: string = '';
    for (let i = 0; i < 10; i++) {
      updatedQuizzesTaken = await getStatValue(page, 'Quizzes Taken:') || '';
      if (updatedQuizzesTaken) break;
      await page.waitForTimeout(500);
    }
    expect(updatedQuizzesTaken).not.toBe(initialQuizzesTaken);
  });
});
