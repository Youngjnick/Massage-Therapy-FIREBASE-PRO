/* global console */
import { test, expect } from '@playwright/test';
import { uiSignIn } from './helpers/uiSignIn';
import fs from 'fs/promises';
import path from 'path';
import './helpers/playwright-coverage';

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
      // Wait for Quiz Length input
      const quizLengthInput = await page.waitForSelector('input[aria-label="Quiz Length"]:not([disabled])', { timeout: 10000 });
      // Select a specific real topic for topic breakdowns
      const TARGET_TOPIC_LABEL = 'Abdominal Muscle Origins';
      const TARGET_TOPIC_VALUE = 'abdominal_muscle_origins';
      let selected = false;
      // Select the first real topic (not empty/Other) if topic select is present
      const topicSelect = page.locator('#quiz-topic-select, [data-testid="quiz-topic-select"]');
      if (await topicSelect.count() > 0) {
        const options = await topicSelect.locator('option').all();
        // Try to select by value first
        for (const opt of options) {
          const val = await opt.getAttribute('value');
          if (val === TARGET_TOPIC_VALUE) {
            await topicSelect.selectOption(val);
            console.log('[E2E DEBUG] Selected topic value (by value):', val);
            selected = true;
            break;
          }
        }
        // If not found by value, try by label
        if (!selected) {
          for (const opt of options) {
            const label = (await opt.textContent())?.trim();
            if (label === TARGET_TOPIC_LABEL) {
              const val = await opt.getAttribute('value');
              if (val) {
                await topicSelect.selectOption(val);
                console.log('[E2E DEBUG] Selected topic value (by label):', val);
                selected = true;
                break;
              }
            }
          }
        }
        // Fallback: select first valid topic (not empty/Other)
        if (!selected) {
          for (const opt of options) {
            const val = await opt.getAttribute('value');
            if (val && val !== '' && val.toLowerCase() !== 'other') {
              await topicSelect.selectOption(val);
              console.log('[E2E DEBUG] Selected topic value (fallback):', val);
              break;
            }
          }
        }
      }
      await quizLengthInput.fill('2');
      await page.getByRole('button', { name: /start/i }).click();
      await page.waitForSelector('[data-testid="quiz-question-card"]', { timeout: 10000 });
      // Answer first question
      const firstOption = page.getByTestId('quiz-option').first();
      await expect(firstOption).toBeVisible();
      await firstOption.click();
      await page.waitForTimeout(150);
      // Wait for Next button to be enabled, then click
      const nextBtn = page.getByRole('button', { name: /next/i });
      await expect(nextBtn).toBeEnabled({ timeout: 10000 });
      await nextBtn.click();
      // Answer second question
      const secondOption = page.getByTestId('quiz-option').first();
      await expect(secondOption).toBeVisible();
      await secondOption.click();
      await page.waitForTimeout(150);
      // Wait for Finish Quiz button to be enabled, then click
      const finishBtn = page.locator('button[aria-label="Finish quiz"]');
      await expect(finishBtn).toBeEnabled({ timeout: 10000 });
      await finishBtn.click();
      // Wait for results
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
