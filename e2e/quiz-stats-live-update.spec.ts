/* global console */
import { test, expect } from '@playwright/test';
import { uiSignIn } from './helpers/uiSignIn';

test.describe('Quiz Stats Live Update', () => {
  test('Stats and topic stats update after quiz completion', async ({ page }) => {
    test.setTimeout(90000);
    try {
      await uiSignIn(page);
      await page.goto('/analytics');
      await page.waitForSelector('h1');
      const initialQuizzesTaken = await page.locator('text=Quizzes Taken:').textContent();
      const initialCorrect = await page.locator('text=Correct Answers:').textContent();
      const initialAccuracy = await page.locator('text=Accuracy:').textContent();
      const initialTopicStats = await page.locator('[data-testid="quiz-topic-progress"]').innerText().catch(() => '');
      await page.waitForTimeout(1000);
      await page.goto('/quiz');
      await page.waitForSelector('[data-testid="quiz-start-form"]', { timeout: 10000 });
      await page.getByLabel('Quiz Length').fill('2');
      await page.getByRole('button', { name: /start/i }).click();
      await page.waitForSelector('[data-testid="quiz-question-card"]', { timeout: 10000 });
      const options = page.getByTestId('quiz-option');
      for (let i = 0; i < 2; i++) {
        await options.first().click();
        // Short wait for UI update
        await page.waitForTimeout(200);
        // --- DEBUG: Log UI state after answering ---
        const buttons = await page.locator('button').elementHandles();
        for (const btn of buttons) {
          const text = await btn.evaluate(el => el.textContent?.trim());
          const enabled = await btn.isEnabled();
          const visible = await btn.isVisible();
          const html = await btn.evaluate(el => (el as HTMLElement).outerHTML);
          console.log(`Button: '${text}', enabled: ${enabled}, visible: ${visible}, html: ${html}`);
        }
        // --- END DEBUG ---
        if (i < 1) {
          // Click the first enabled and visible Next button (do not wait for visible)
          const nextButtons = await page.locator('button').filter({ hasText: 'Next' }).elementHandles();
          let clicked = false;
          for (const btn of nextButtons) {
            if (await btn.isVisible() && await btn.isEnabled()) {
              await btn.click();
              clicked = true;
              break;
            }
          }
          if (!clicked) {
            const allButtons = await page.locator('button').allTextContents();
            console.log('No enabled/visible Next button found. Visible buttons:', allButtons);
            try { await page.screenshot({ path: 'no-next-btn.png', fullPage: true }); } catch {/* ignore screenshot error */}
            throw new Error('Next button not found after answering question.');
          }
        } else {
          // Click the enabled and visible Finish Quiz button
          const finishButtons = await page.locator('button').filter({ hasText: 'Finish Quiz' }).elementHandles();
          let clicked = false;
          for (const btn of finishButtons) {
            if (await btn.isVisible() && await btn.isEnabled()) {
              await btn.click();
              clicked = true;
              break;
            }
          }
          if (!clicked) {
            const allButtons = await page.locator('button').allTextContents();
            console.log('No enabled/visible Finish Quiz button found. Visible buttons:', allButtons);
            try { await page.screenshot({ path: 'no-finish-btn.png', fullPage: true }); } catch {/* ignore screenshot error */}
            throw new Error('Finish Quiz button not found after answering last question.');
          }
        }
      }
      await expect(page.getByTestId('quiz-results')).toBeVisible();
      await page.goto('/analytics');
      // Poll for updated stats for up to 15 seconds
      let updated = false;
      let updatedQuizzesTaken, updatedCorrect, updatedAccuracy, updatedTopicStats;
      for (let i = 0; i < 15; i++) {
        await page.waitForTimeout(1000);
        updatedQuizzesTaken = await page.locator('text=Quizzes Taken:').textContent();
        updatedCorrect = await page.locator('text=Correct Answers:').textContent();
        updatedAccuracy = await page.locator('text=Accuracy:').textContent();
        updatedTopicStats = await page.locator('[data-testid="quiz-topic-progress"]').innerText().catch(() => '');
        if (
          updatedQuizzesTaken !== initialQuizzesTaken ||
          updatedCorrect !== initialCorrect ||
          updatedAccuracy !== initialAccuracy ||
          updatedTopicStats !== initialTopicStats
        ) {
          updated = true;
          break;
        }
      }
      // Log the full text content of the stats before assertion
      const quizzesTakenText = await page.locator('text=Quizzes Taken:').textContent();
      const correctText = await page.locator('text=Correct Answers:').textContent();
      const accuracyText = await page.locator('text=Accuracy:').textContent();
      const topicStatsText = await page.locator('[data-testid="quiz-topic-progress"]').innerText().catch(() => '');
      console.log('Final Quizzes Taken text:', quizzesTakenText);
      console.log('Final Correct Answers text:', correctText);
      console.log('Final Accuracy text:', accuracyText);
      console.log('Final Topic Stats text:', topicStatsText);
      // Extract numbers from the stats text
      function extractNumber(text: string | null) {
        if (!text) return null;
        const match = text.match(/\d+/);
        return match ? parseInt(match[0], 10) : null;
      }
      const initialQuizzesTakenNum = extractNumber(initialQuizzesTaken ?? null);
      const updatedQuizzesTakenNum = extractNumber(updatedQuizzesTaken ?? null);
      const initialCorrectNum = extractNumber(initialCorrect ?? null);
      const updatedCorrectNum = extractNumber(updatedCorrect ?? null);
      const initialAccuracyNum = extractNumber(initialAccuracy ?? null);
      const updatedAccuracyNum = extractNumber(updatedAccuracy ?? null);
      // Assert that the numbers have changed
      expect(updated).toBe(true);
      expect(updatedQuizzesTakenNum).not.toBe(initialQuizzesTakenNum);
      expect(updatedCorrectNum).not.toBe(initialCorrectNum);
      expect(updatedAccuracyNum).not.toBe(initialAccuracyNum);
      expect(updatedTopicStats).not.toBe(initialTopicStats);
    } catch (err) {
      // Print error for debugging
      // eslint-disable-next-line no-undef
      console.error('Test failed:', err);
      throw err;
    }
  });
});
