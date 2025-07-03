/* global console */
import { test, expect } from '@playwright/test';
import { uiSignIn } from './helpers/uiSignIn';
import fs from 'fs/promises';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
async function getTestUser(index = 0) {
  const usersPath = path.resolve(__dirname, 'test-users.json');
  const usersRaw = await fs.readFile(usersPath, 'utf-8');
  const users = JSON.parse(usersRaw);
  return users[index];
}

test.describe('Quiz Stats Live Update', () => {
  test('Stats and topic stats update after quiz completion', async ({ page }) => {
    test.setTimeout(90000);
    try {
      const user = await getTestUser(0);
      await uiSignIn(page, { email: user.email, password: user.password });
      await page.goto('/analytics');
      await page.waitForSelector('h1');
      // --- Capture initial stats before starting the quiz ---
      const initialQuizzesDiv = await page.locator('div', { hasText: 'Quizzes Taken:' }).first();
      const initialQuizzesTakenText = await initialQuizzesDiv.textContent();
      const initialCorrectDiv = await page.locator('div', { hasText: 'Correct Answers:' }).first();
      const initialCorrectText = await initialCorrectDiv.textContent();
      const initialAccuracyDiv = await page.locator('div', { hasText: 'Accuracy:' }).first();
      const initialAccuracyText = await initialAccuracyDiv.textContent();
      const initialTopicStats = await page.locator('[data-testid="quiz-topic-progress"]').innerText().catch(() => '');
      const initialQuizzesTakenNum = extractNumberAfterLabel(initialQuizzesTakenText ?? null, 'Quizzes Taken:');
      const initialCorrectNum = extractNumberAfterLabel(initialCorrectText ?? null, 'Correct Answers:');
      const initialAccuracyNum = extractNumberAfterLabel(initialAccuracyText ?? null, 'Accuracy:');
      const initialTopicStatsNumbers = extractTopicStatsNumbers(initialTopicStats ?? null);
      // --- End capture initial stats ---
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
      let updatedQuizzesTaken, updatedCorrect, updatedAccuracy, updatedTopicStats;
      for (let i = 0; i < 15; i++) {
        await page.waitForTimeout(1000);
        // Use correct selectors for polling
        const quizzesDiv = await page.locator('div', { hasText: 'Quizzes Taken:' }).first();
        updatedQuizzesTaken = await quizzesDiv.textContent();
        const correctDiv = await page.locator('div', { hasText: 'Correct Answers:' }).first();
        updatedCorrect = await correctDiv.textContent();
        const accuracyDiv = await page.locator('div', { hasText: 'Accuracy:' }).first();
        updatedAccuracy = await accuracyDiv.textContent();
        updatedTopicStats = await page.locator('[data-testid="quiz-topic-progress"]').innerText().catch(() => '');
        const updatedTopicStatsNumbers = extractTopicStatsNumbers(updatedTopicStats ?? null);
        // Extract numbers
        const updatedQuizzesTakenNum = extractNumberAfterLabel(updatedQuizzesTaken ?? null, 'Quizzes Taken:');
        const updatedCorrectNum = extractNumberAfterLabel(updatedCorrect ?? null, 'Correct Answers:');
        const updatedAccuracyNum = extractNumberAfterLabel(updatedAccuracy ?? null, 'Accuracy:');
        // Compare to initial
        if (
          updatedQuizzesTakenNum !== initialQuizzesTakenNum ||
          updatedCorrectNum !== initialCorrectNum ||
          updatedAccuracyNum !== initialAccuracyNum ||
          updatedTopicStatsNumbers.correct !== initialTopicStatsNumbers.correct
        ) {
          break;
        }
      }
      // Log the full text content of the stats before assertion
      // Updated selectors: get the full div text and extract the value after the label
      const quizzesTakenDiv = await page.locator('div', { hasText: 'Quizzes Taken:' }).first();
      const quizzesTakenText = await quizzesTakenDiv.textContent();
      const correctDiv = await page.locator('div', { hasText: 'Correct Answers:' }).first();
      const correctText = await correctDiv.textContent();
      const accuracyDiv = await page.locator('div', { hasText: 'Accuracy:' }).first();
      const accuracyText = await accuracyDiv.textContent();
      const topicStatsText = await page.locator('[data-testid="quiz-topic-progress"]').innerText().catch(() => '');
      console.log('Final Quizzes Taken text:', quizzesTakenText);
      console.log('Final Correct Answers text:', correctText);
      console.log('Final Accuracy text:', accuracyText);
      console.log('Final Topic Stats text:', topicStatsText);
      // Extract numbers from the stats text (after the label)
      function extractNumberAfterLabel(text: string | null, label: string) {
        if (!text) return null;
        const match = text.replace(label, '').match(/\d+/);
        return match ? parseInt(match[0], 10) : null;
      }
      // Extract correct/total numbers from topic stats string
      function extractTopicStatsNumbers(text: string | null) {
        if (!text) return { correct: null, total: null };
        const match = text.match(/(\d+)\s*\/\s*(\d+)/);
        if (!match) return { correct: null, total: null };
        return { correct: parseInt(match[1], 10), total: parseInt(match[2], 10) };
      }
      const updatedQuizzesTakenNum = extractNumberAfterLabel(quizzesTakenText ?? null, 'Quizzes Taken:');
      const updatedCorrectNum = extractNumberAfterLabel(correctText ?? null, 'Correct Answers:');
      const updatedAccuracyNum = extractNumberAfterLabel(accuracyText ?? null, 'Accuracy:');
      const updatedTopicStatsNumbers = extractTopicStatsNumbers(updatedTopicStats ?? null);
      // Assert that at least one stat has changed
      const statsChanged =
        updatedQuizzesTakenNum !== initialQuizzesTakenNum ||
        updatedCorrectNum !== initialCorrectNum ||
        updatedAccuracyNum !== initialAccuracyNum ||
        updatedTopicStatsNumbers.correct !== initialTopicStatsNumbers.correct;
      console.log('Initial/Updated Quizzes Taken:', initialQuizzesTakenNum, updatedQuizzesTakenNum);
      console.log('Initial/Updated Correct:', initialCorrectNum, updatedCorrectNum);
      console.log('Initial/Updated Accuracy:', initialAccuracyNum, updatedAccuracyNum);
      console.log('Initial/Updated Topic Correct:', initialTopicStatsNumbers.correct, updatedTopicStatsNumbers.correct);
      expect(statsChanged).toBe(true);
    } catch (err) {
      // Print error for debugging
      console.error('Test failed:', err);
      throw err;
    }
  });
});
