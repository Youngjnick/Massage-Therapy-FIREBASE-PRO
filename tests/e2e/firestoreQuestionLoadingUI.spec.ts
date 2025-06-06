// @ts-nocheck
import { test, expect } from '@playwright/test';
import { mockAuth } from './helpers/e2eDebugHelpers';

test.describe('Firestore Question Loading UI', () => {
  test('firestore question loading UI', async ({ page }) => {
    await mockAuth(page); // Set up mock authentication
    await page.goto('/');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.evaluate(() => (window as any).waitForE2EReactReady && (window as any).waitForE2EReactReady());
    // Wait for questions to load (adjust selector as needed)
    await page.waitForSelector('.question, .quiz-question, .question-list-item', { timeout: 5000 });
    // Check that at least one question is displayed
    const questionCount = await page.locator('.question, .quiz-question, .question-list-item').count();
    expect(questionCount).toBeGreaterThan(0);
    // Optionally, check that the question text is not empty
    const questionText = await page.locator('.question, .quiz-question, .question-list-item').first().textContent();
    expect(questionText?.trim().length).toBeGreaterThan(0);
  });
});