// @ts-nocheck
import { test, expect } from '@playwright/test';
/* global console */
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
    const userUid = await page.evaluate(() => window.localStorage.getItem('firebaseUserUid'));
    console.log('[E2E DEBUG] initialQuizzesTaken:', initialQuizzesTaken, 'userUid:', userUid);
    const initial = parseInt(initialQuizzesTaken, 10) || 0;
    // Take two quizzes
    let lastStat = initial;
    for (let quizNum = 0; quizNum < 2; quizNum++) {
      await page.goto('/quiz');
      await page.waitForSelector('[data-testid="quiz-start-form"]', { timeout: 10000 });
      await page.getByLabel('Quiz Length').fill('1');
      await page.getByRole('button', { name: /start/i }).click();
      await page.waitForSelector('[data-testid="quiz-question-card"]', { timeout: 10000 });
      await page.getByTestId('quiz-option').first().click();
      await page.getByRole('button', { name: /next|finish/i }).click();
      await expect(page.getByTestId('quiz-results')).toBeVisible();
      // Extra debug: check if quiz is marked complete in UI
      const quizResultsText = await page.getByTestId('quiz-results').textContent();
      console.log(`[E2E DEBUG] quizResultsText after quiz #${quizNum+1}:`, quizResultsText);
      // Wait for stat update to propagate (poll for stat increment)
      let statUpdated = false;
      for (let poll = 0; poll < 40; poll++) { // Increase polling attempts
        await page.goto('/analytics');
        await page.waitForTimeout(1500); // Increase wait time
        let polledStat = await getStatValue(page, 'Quizzes Taken:') || '';
        const polledUid = await page.evaluate(() => window.localStorage.getItem('firebaseUserUid'));
        console.log(`[E2E DEBUG] Poll #${poll+1} after quiz: Quizzes Taken:`, polledStat, 'userUid:', polledUid);
        if (parseInt(polledStat, 10) > lastStat) {
          statUpdated = true;
          lastStat = parseInt(polledStat, 10);
          break;
        }
        // Extra: force Firestore refresh by reloading page
        await page.reload();
      }
      if (!statUpdated) {
        // Print Firestore emulator debug info if available
        console.error(`[E2E ERROR] Quizzes Taken stat did not increment after quiz #${quizNum+1}`);
        throw new Error('Quizzes Taken stat did not increment after quiz');
      }
      // Add a delay after stat update before next quiz
      if (quizNum === 0) {
        console.log('[E2E DEBUG] Waiting 5s before starting next quiz to allow backend/Firestore to sync.');
        await page.waitForTimeout(5000);
      }
    }
    // Final check: stat should be at least initial + 2
    await page.goto('/analytics');
    let updatedQuizzesTaken = '';
    for (let i = 0; i < 10; i++) {
      updatedQuizzesTaken = await getStatValue(page, 'Quizzes Taken:') || '';
      if (updatedQuizzesTaken) break;
      await page.waitForTimeout(500);
    }
    const userUidAfter = await page.evaluate(() => window.localStorage.getItem('firebaseUserUid'));
    console.log('[E2E DEBUG] updatedQuizzesTaken:', updatedQuizzesTaken, 'userUid:', userUidAfter);
    const updated = parseInt(updatedQuizzesTaken, 10) || 0;
    expect(updated).toBeGreaterThanOrEqual(initial + 2);
  }, 60000);
});
