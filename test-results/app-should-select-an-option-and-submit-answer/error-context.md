# Test info

- Name: should select an option and submit answer
- Location: /Users/macuser/Desktop/Massage_Therapy_Smart_Study_PRO_FIREBASE_ELITE_REACT/e2e/app.spec.ts:18:5

# Error details

```
Error: locator.click: Test ended.
Call log:
  - waiting for getByTestId('quiz-option').first()

    at /Users/macuser/Desktop/Massage_Therapy_Smart_Study_PRO_FIREBASE_ELITE_REACT/e2e/app.spec.ts:24:49
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test('should load the homepage and display the main heading', async ({ page }) => {
   4 |   await page.goto('/');
   5 |   await expect(page.locator('h1, h2, h3')).toHaveText(/quiz|massage|study/i, { useInnerText: true });
   6 | });
   7 |
   8 | test('should start a quiz and display the first question', async ({ page }) => {
   9 |   await page.goto('/');
  10 |   // Fill out and submit the start form (adjust selectors as needed)
  11 |   await page.getByLabel('Quiz Length').fill('1');
  12 |   await page.getByLabel(/topic/i).selectOption({ index: 0 });
  13 |   await page.getByRole('button', { name: /start/i }).click();
  14 |   // Should see a question card
  15 |   await expect(page.getByTestId('quiz-question-card')).toBeVisible();
  16 | });
  17 |
  18 | test('should select an option and submit answer', async ({ page }) => {
  19 |   await page.goto('/');
  20 |   await page.getByLabel('Quiz Length').fill('1');
  21 |   await page.getByLabel(/topic/i).selectOption({ index: 0 });
  22 |   await page.getByRole('button', { name: /start/i }).click();
  23 |   // Select first option and submit
> 24 |   await page.getByTestId('quiz-option').first().click();
     |                                                 ^ Error: locator.click: Test ended.
  25 |   await page.getByRole('button', { name: /submit/i }).click();
  26 |   // Should see feedback
  27 |   await expect(page.getByTestId('quiz-feedback')).toBeVisible();
  28 | });
  29 |
  30 | test('should navigate to next question or finish quiz', async ({ page }) => {
  31 |   await page.goto('/');
  32 |   await page.getByLabel('Quiz Length').fill('2');
  33 |   await page.getByLabel(/topic/i).selectOption({ index: 0 });
  34 |   await page.getByRole('button', { name: /start/i }).click();
  35 |   // Answer first question
  36 |   await page.getByTestId('quiz-option').first().click();
  37 |   await page.getByRole('button', { name: /submit/i }).click();
  38 |   await page.getByRole('button', { name: /next/i }).click();
  39 |   // Should see second question or summary
  40 |   const summary = page.getByTestId('quiz-summary');
  41 |   if (await summary.isVisible()) {
  42 |     await expect(summary).toBeVisible();
  43 |   } else {
  44 |     await expect(page.getByTestId('quiz-question-card')).toBeVisible();
  45 |   }
  46 | });
  47 |
```