/* global console */
import { resetUserStats } from './helpers/resetUserStats';
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
  test('should persist updated stats after quiz and reload', async ({ page, browserName }) => {
    await uiSignIn(page);
    const userUid = await page.evaluate(() => window.localStorage.getItem('firebaseUserUid'));
    // Ensure userUid is not null before resetting stats
    if (!userUid) {
      throw new Error('firebaseUserUid not found in localStorage after sign-in.');
    }
    // Reset stat before test using Node.js helper
    await resetUserStats(userUid);
    await page.goto('/analytics');
    // Wait for stat value to be non-empty (should be 0 after reset)
    let initialQuizzesTaken = '';
    for (let i = 0; i < 10; i++) {
      initialQuizzesTaken = await getStatValue(page, 'Quizzes Taken:') || '';
      if (initialQuizzesTaken !== '') break;
      await page.waitForTimeout(500);
    }
    console.log('[E2E DEBUG] initialQuizzesTaken after reset:', initialQuizzesTaken, typeof initialQuizzesTaken, 'userUid:', userUid);
    // Take a quiz
    await page.goto('/quiz');
    let quizStartFormFound = false;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await page.waitForSelector('[data-testid="quiz-start-form"]', { timeout: 15000 });
        quizStartFormFound = true;
        break;
      } catch {
        console.log('[E2E DEBUG] quiz-start-form not found, attempt', attempt + 1, 'reloading...');
        await page.reload();
      }
    }
    if (!quizStartFormFound) {
      const html = await page.content();
      throw new Error('Quiz start form not found after retries. HTML: ' + html);
    }
    // Scroll Quiz Length input into view for mobile
    const quizLengthInput = await page.getByLabel('Quiz Length');
    await quizLengthInput.scrollIntoViewIfNeeded();
    await quizLengthInput.fill('1');
    const startBtn = await page.getByRole('button', { name: /start/i });
    await startBtn.scrollIntoViewIfNeeded();
    await startBtn.click();
    await page.waitForSelector('[data-testid="quiz-question-card"]', { timeout: 15000 });
    const firstOption = await page.getByTestId('quiz-option').first();
    await firstOption.scrollIntoViewIfNeeded();
    await firstOption.click();
    const nextOrFinishBtn = await page.getByRole('button', { name: /next|finish/i });
    await nextOrFinishBtn.scrollIntoViewIfNeeded();
    await nextOrFinishBtn.click();
    await expect(page.getByTestId('quiz-results')).toBeVisible();
    // Wait for stat update to propagate (poll for stat change)
    let updatedQuizzesTaken = '';
    let statChanged = false;
    for (let poll = 0; poll < 20; poll++) {
      await page.goto('/analytics', { waitUntil: 'load' });
      await page.waitForTimeout(browserName === 'webkit' || browserName === 'chromium' ? 1200 : 2000); // longer for mobile
      updatedQuizzesTaken = await getStatValue(page, 'Quizzes Taken:') || '';
      const polledUid = await page.evaluate(() => window.localStorage.getItem('firebaseUserUid'));
      const analyticsHtml = await page.content();
      console.log(`[E2E DEBUG] Poll #${poll+1} after quiz: Quizzes Taken:`, updatedQuizzesTaken, typeof updatedQuizzesTaken, 'userUid:', polledUid);
      console.log(`[E2E DEBUG] Analytics page HTML after poll #${poll+1}:`, analyticsHtml);
      // Compare as numbers if possible
      const initialNum = parseInt(initialQuizzesTaken, 10);
      const updatedNum = parseInt(updatedQuizzesTaken, 10);
      if (!isNaN(initialNum) && !isNaN(updatedNum) && updatedNum > initialNum) {
        statChanged = true;
        break;
      }
      // Fallback: compare as strings
      if (updatedQuizzesTaken && updatedQuizzesTaken !== initialQuizzesTaken) {
        statChanged = true;
        break;
      }
    }
    if (!statChanged) {
      throw new Error(`Quizzes Taken stat did not change after quiz. initial: ${initialQuizzesTaken}, updated: ${updatedQuizzesTaken}`);
    }
    const userUidAfter = await page.evaluate(() => window.localStorage.getItem('firebaseUserUid'));
    console.log('[E2E DEBUG] updatedQuizzesTaken:', updatedQuizzesTaken, typeof updatedQuizzesTaken, 'userUid:', userUidAfter);
    expect(updatedQuizzesTaken).not.toBe(initialQuizzesTaken);
  });
});
