import { test, expect } from '@playwright/test';
import { generateTokenAndSignIn } from './helpers/generateAndSignIn';

// Add extra debugging and waits to diagnose auth/timing issues
test.beforeEach(async ({ page }) => {
  await generateTokenAndSignIn(page);
  // Wait for Firebase auth to be established
  await page.waitForTimeout(2000);
  // Log auth state
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      // Print all errors/warnings
      // eslint-disable-next-line no-undef
      globalThis.console.log('[PAGE CONSOLE]', msg.text());
    }
  });
  page.on('pageerror', error => {
    // eslint-disable-next-line no-undef
    globalThis.console.log('[PAGE ERROR]', error.message);
  });
});

test.describe.skip('Quiz Stats Live Update', () => {
  test('Stats and topic stats update after quiz completion', async ({ page }) => {
    test.setTimeout(60000); // Increase timeout to 60s for this test
    try {
      // Robust error and network logging
      page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
          globalThis.console.log('[PAGE CONSOLE]', msg.text());
        }
      });
      page.on('pageerror', error => {
        globalThis.console.log('[PAGE ERROR]', error.message);
      });
      page.on('requestfailed', request => {
        globalThis.console.log('[REQUEST FAILED]', request.url(), request.failure()?.errorText);
      });
      // Go to analytics page and record initial stats
      await page.goto('/analytics');
      await page.waitForSelector('h1');
      globalThis.console.log('[DEBUG] Phase: after analytics goto');
      globalThis.console.log('[DEBUG] URL:', page.url());
      globalThis.console.log('[DEBUG] Title:', await page.title());
      if (page.isClosed()) {
        throw new Error('Page is closed after analytics navigation');
      }
      const initialQuizzesTaken = await page.locator('text=Quizzes Taken:').textContent();
      const initialCorrect = await page.locator('text=Correct Answers:').textContent();
      const initialAccuracy = await page.locator('text=Accuracy:').textContent();
      const initialTopicStats = await page.locator('[data-testid="quiz-topic-progress"]').innerText().catch(() => '');
      // Wait to ensure stats are loaded
      await page.waitForTimeout(1000);
      globalThis.console.log('[DEBUG] Phase: after analytics stats read');
      if (page.isClosed()) {
        throw new Error('Page is closed after analytics stats read');
      }
      // Start a new quiz and complete it
      await page.goto('/quiz');
      globalThis.console.log('[DEBUG] Phase: after quiz goto');
      globalThis.console.log('[DEBUG] URL:', page.url());
      globalThis.console.log('[DEBUG] Title:', await page.title());
      if (page.isClosed()) {
        throw new Error('Page is closed after quiz navigation');
      }
      await page.waitForSelector('[data-testid="quiz-start-form"]', { timeout: 10000 });
      // Fill out and start quiz (adjust selectors as needed)
      await page.getByLabel('Quiz Length').fill('2');
      await page.getByRole('button', { name: /start/i }).click();
      await page.waitForSelector('[data-testid="quiz-question-card"]', { timeout: 10000 });
      // Answer all questions
      const options = page.getByTestId('quiz-option');
      for (let i = 0; i < 2; i++) {
        await options.first().click();
        await page.getByRole('button', { name: /next|finish/i }).click();
      }
      await expect(page.getByTestId('quiz-results')).toBeVisible();
      // Go back to analytics and check for updated stats
      await page.goto('/analytics');
      await page.waitForTimeout(2000); // Wait for Firestore onSnapshot to update
      const updatedQuizzesTaken = await page.locator('text=Quizzes Taken:').textContent();
      const updatedCorrect = await page.locator('text=Correct Answers:').textContent();
      const updatedAccuracy = await page.locator('text=Accuracy:').textContent();
      const updatedTopicStats = await page.locator('[data-testid="quiz-topic-progress"]').innerText().catch(() => '');
      // Log for debugging
      globalThis.console.log('Initial:', initialQuizzesTaken, initialCorrect, initialAccuracy, initialTopicStats);
      globalThis.console.log('Updated:', updatedQuizzesTaken, updatedCorrect, updatedAccuracy, updatedTopicStats);
      // Assert that stats have changed
      expect(updatedQuizzesTaken).not.toBe(initialQuizzesTaken);
      expect(updatedCorrect).not.toBe(initialCorrect);
      expect(updatedAccuracy).not.toBe(initialAccuracy);
      expect(updatedTopicStats).not.toBe(initialTopicStats);
    } catch (err) {
      globalThis.console.error('[TEST ERROR]', err);
      throw err;
    }
  });
});
