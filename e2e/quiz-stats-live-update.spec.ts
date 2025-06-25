import { test, expect } from '@playwright/test';
import { generateTokenAndSignIn } from './helpers/generateAndSignIn';

// Use the automated token generation and sign-in before each test
test.beforeEach(async ({ page }) => {
  await generateTokenAndSignIn(page);
});

// This test assumes a user is already authenticated or uses a test account.
test.describe('Quiz Stats Live Update', () => {
  test('Stats and topic stats update after quiz completion', async ({ page }) => {
    // Go to analytics page and record initial stats
    await page.goto('/analytics');
    await page.waitForSelector('h1');
    const initialQuizzesTaken = await page.locator('text=Quizzes Taken:').textContent();
    const initialCorrect = await page.locator('text=Correct Answers:').textContent();
    const initialAccuracy = await page.locator('text=Accuracy:').textContent();
    // Optionally, grab topic stats as well
    const initialTopicStats = await page.locator('[data-testid="quiz-topic-progress"]').innerText().catch(() => '');

    // Start a new quiz and complete it
    await page.goto('/quiz');
    await page.waitForSelector('[data-testid="quiz-start-form"]');
    // Fill out and start quiz (adjust selectors as needed)
    await page.getByLabel('Quiz Length').fill('2');
    await page.getByRole('button', { name: /start/i }).click();
    await page.waitForSelector('[data-testid="quiz-question-card"]');
    // Answer all questions
    const options = page.getByTestId('quiz-option');
    for (let i = 0; i < 2; i++) {
      await options.first().click();
      await page.getByRole('button', { name: /next|finish/i }).click();
    }
    await expect(page.getByTestId('quiz-results')).toBeVisible();

    // Go back to analytics and check for updated stats
    await page.goto('/analytics');
    await page.waitForTimeout(1000); // Wait for Firestore onSnapshot to update
    const updatedQuizzesTaken = await page.locator('text=Quizzes Taken:').textContent();
    const updatedCorrect = await page.locator('text=Correct Answers:').textContent();
    const updatedAccuracy = await page.locator('text=Accuracy:').textContent();
    const updatedTopicStats = await page.locator('[data-testid="quiz-topic-progress"]').innerText().catch(() => '');

    // Assert that stats have changed
    expect(updatedQuizzesTaken).not.toBe(initialQuizzesTaken);
    expect(updatedCorrect).not.toBe(initialCorrect);
    expect(updatedAccuracy).not.toBe(initialAccuracy);
    expect(updatedTopicStats).not.toBe(initialTopicStats);
  });
});
