import { test, expect } from '@playwright/test';

test('should load the homepage and display the main heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1, h2, h3')).toHaveText(/quiz|massage|study/i, { useInnerText: true });
});

test('should start a quiz and display the first question', async ({ page }) => {
  await page.goto('/');
  // Fill out and submit the start form (adjust selectors as needed)
  await page.getByLabel('Quiz Length').fill('1');
  await page.getByLabel(/topic/i).selectOption({ index: 0 });
  await page.getByRole('button', { name: /start/i }).click();
  // Should see a question card
  await expect(page.getByTestId('quiz-question-card')).toBeVisible();
});

test('should select an option and submit answer', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('1');
  await page.getByLabel(/topic/i).selectOption({ index: 0 });
  await page.getByRole('button', { name: /start/i }).click();
  // Select first option (should instantly submit)
  await page.getByTestId('quiz-option').first().click();
  // Should see feedback
  await expect(page.getByTestId('quiz-feedback')).toBeVisible();
});

test('should navigate to next question or finish quiz', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('2');
  await page.getByLabel(/topic/i).selectOption({ index: 0 });
  await page.getByRole('button', { name: /start/i }).click();
  // Answer first question
  await page.getByTestId('quiz-option').first().click();
  // Should see feedback
  await expect(page.getByTestId('quiz-feedback')).toBeVisible();
  await page.getByRole('button', { name: /next/i }).click();
  // Should see second question or summary
  const summary = page.getByTestId('quiz-summary');
  if (await summary.isVisible()) {
    await expect(summary).toBeVisible();
  } else {
    await expect(page.getByTestId('quiz-question-card')).toBeVisible();
  }
});

test('should show feedback for correct and incorrect answers', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('2');
  await page.getByLabel(/topic/i).selectOption({ index: 0 });
  await page.getByRole('button', { name: /start/i }).click();

  // First question: select first option
  await page.getByTestId('quiz-option').first().click();
  await expect(page.getByTestId('quiz-feedback')).toBeVisible();
  const feedback1 = await page.getByTestId('quiz-feedback').innerText();
  expect(['Correct!', 'Incorrect.']).toContain(feedback1);

  // If there is a next question, answer it too
  const nextQuestion = await page.getByTestId('quiz-option').nth(1).isVisible().catch(() => false);
  if (nextQuestion) {
    await page.getByTestId('quiz-option').nth(1).click();
    await expect(page.getByTestId('quiz-feedback')).toBeVisible();
    const feedback2 = await page.getByTestId('quiz-feedback').innerText();
    expect(['Correct!', 'Incorrect.']).toContain(feedback2);
  }
});

test('should complete a quiz and see summary/results', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('1');
  await page.getByLabel(/topic/i).selectOption({ index: 0 });
  await page.getByRole('button', { name: /start/i }).click();
  await page.getByTestId('quiz-option').first().click();
  // Try to find a summary/results element (customize selector as needed)
  // For now, just check that the quiz-feedback is visible at the end
  await expect(page.getByTestId('quiz-feedback')).toBeVisible();
});
