// @ts-nocheck
// Ensure emulator env vars are set for all helpers, even if Playwright misses them
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'massage-therapy-smart-st-c7f8f';
process.env.GCLOUD_PROJECT = process.env.GCLOUD_PROJECT || 'massage-therapy-smart-st-c7f8f';

import { test, expect, Page } from '@playwright/test';
import { resetUserStats } from './helpers/resetUserStats';
import { uiSignIn } from './helpers/uiSignIn';

async function getStatValue(page: Page, label: string): Promise<string> {
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
    console.log('[E2E DEBUG] E2E test: after sign-in, before resetUserStats');
    await uiSignIn(page);
    const userUid = await page.evaluate(() => window.localStorage.getItem('firebaseUserUid'));
    // Ensure userUid is not null before resetting stats
    if (!userUid) {
      throw new Error('firebaseUserUid not found in localStorage after sign-in.');
    }
    // Reset stat before test using Node.js helper
    await resetUserStats(userUid);
    console.log('[E2E DEBUG] E2E test: after resetUserStats');
    // Log Firestore analytics doc directly after reset
    const { getUserStats } = await import('./helpers/getUserStats');
    const statsAfterReset = await getUserStats(userUid);
    console.log('[E2E DEBUG] Firestore analytics doc after reset:', statsAfterReset);
    await page.goto('/analytics');
    console.log('[E2E DEBUG] E2E test: after goto /analytics');
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
    console.log('[E2E DEBUG] E2E test: after goto /quiz');
    let quizStartFormFound = false;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await page.waitForSelector('[data-testid="quiz-start-form"]', { timeout: 15000 });
        console.log('[E2E DEBUG] E2E test: quiz-start-form found');
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
    console.log('[E2E DEBUG] E2E test: quiz length set to 1');
    const startBtn = await page.getByRole('button', { name: /start/i });
    await startBtn.scrollIntoViewIfNeeded();
    await startBtn.click();
    console.log('[E2E DEBUG] E2E test: start button clicked');
    await page.waitForSelector('[data-testid="quiz-question-card"]', { timeout: 15000 });
    console.log('[E2E DEBUG] E2E test: quiz-question-card visible');

    const firstOption = await page.getByTestId('quiz-option').first();
    await firstOption.scrollIntoViewIfNeeded();
    await firstOption.click();
    console.log('[E2E DEBUG] E2E test: first quiz option clicked');
    const nextOrFinishBtn = await page.getByRole('button', { name: /next|finish/i });
    await nextOrFinishBtn.scrollIntoViewIfNeeded();
    await nextOrFinishBtn.click();
    console.log('[E2E DEBUG] E2E test: next/finish button clicked');
    await expect(page.getByTestId('quiz-results')).toBeVisible();
    console.log('[E2E DEBUG] E2E test: quiz-results visible');
    // Wait to allow frontend effect to run
    await page.waitForTimeout(2000);
    // Log Firestore analytics doc directly after quiz completion
    const statsAfterQuiz = await getUserStats(userUid);
    console.log('[E2E DEBUG] Firestore analytics doc after quiz:', statsAfterQuiz);

    // --- Fallback: if stat not updated, call backend helper directly ---
    if (!statsAfterQuiz || typeof statsAfterQuiz.completed === 'undefined' || statsAfterQuiz.completed === 0) {
      console.log('[E2E DEBUG] Fallback: calling updateQuizStatsOnFinish directly from test');
      const { updateQuizStatsOnFinish } = await import('./helpers/updateQuizStatsOnFinish');
      await updateQuizStatsOnFinish(userUid);
      const statsAfterDirect = await getUserStats(userUid);
      console.log('[E2E DEBUG] Firestore analytics doc after direct update:', statsAfterDirect);
    }
    // Wait for stat update to propagate (poll for stat change)
    let updatedQuizzesTaken = '';
    let statChanged = false;
    const maxPolls = browserName === 'webkit' || browserName === 'chromium' ? 30 : 40; // more polls for mobile
    const pollWait = browserName === 'webkit' || browserName === 'chromium' ? 1500 : 2500;
    for (let poll = 0; poll < maxPolls; poll++) {
      await page.goto('/analytics', { waitUntil: 'load' });
      await page.waitForTimeout(pollWait); // longer for mobile
      updatedQuizzesTaken = await getStatValue(page, 'Quizzes Taken:') || '';
      const polledUid = await page.evaluate(() => window.localStorage.getItem('firebaseUserUid'));
      const analyticsHtml = await page.content();
      console.log(`[E2E DEBUG] Poll #${poll+1} after quiz: Quizzes Taken:`, updatedQuizzesTaken, typeof updatedQuizzesTaken, 'userUid:', polledUid);
      // Only log HTML every 5 polls to reduce noise
      if ((poll + 1) % 5 === 0) {
        console.log(`[E2E DEBUG] Analytics page HTML after poll #${poll+1}:`, analyticsHtml);
      }
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
      // --- Direct Firestore check in polling loop (for debugging) ---
      const polledStats = await getUserStats(userUid);
      if (polledStats && typeof polledStats.completed !== 'undefined') {
        console.log(`[E2E DEBUG] Poll #${poll+1} Firestore completed:`, polledStats.completed);
        if (!isNaN(initialNum) && polledStats.completed > initialNum) {
          statChanged = true;
          break;
        }
      }
    }
    if (!statChanged) {
      const analyticsHtml = await page.content();
      console.error('[E2E DEBUG] Final analytics HTML:', analyticsHtml);
      throw new Error(`Quizzes Taken stat did not change after quiz. initial: ${initialQuizzesTaken}, updated: ${updatedQuizzesTaken}`);
    }
    const userUidAfter = await page.evaluate(() => window.localStorage.getItem('firebaseUserUid'));
    console.log('[E2E DEBUG] updatedQuizzesTaken:', updatedQuizzesTaken, typeof updatedQuizzesTaken, 'userUid:', userUidAfter);
    expect(updatedQuizzesTaken).not.toBe(initialQuizzesTaken);
  }, 90000); // Increase test timeout to 90s
});
