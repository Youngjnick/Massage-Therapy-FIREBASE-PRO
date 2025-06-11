# Test info

- Name: should reset quiz and focus first option after restart
- Location: /Users/macuser/Desktop/Massage_Therapy_Smart_Study_PRO_FIREBASE_ELITE_REACT/e2e/app.spec.ts:40:5

# Error details

```
Error: locator.click: Test ended.
Call log:
  - waiting for getByRole('button', { name: /start new quiz/i })

    at /Users/macuser/Desktop/Massage_Therapy_Smart_Study_PRO_FIREBASE_ELITE_REACT/e2e/app.spec.ts:46:63
```

# Test source

```ts
   1 | /* eslint-env browser */
   2 | import { test, expect } from '@playwright/test';
   3 |
   4 | // Only run the failing test for now
   5 | test('should focus first option after starting quiz', async ({ page }) => {
   6 |   await page.goto('/');
   7 |   await page.getByLabel('Quiz Length').fill('1');
   8 |   await page.getByLabel(/topic/i).selectOption({ index: 0 });
   9 |   await page.getByRole('button', { name: /start/i }).click();
   10 |   const firstOption = page.getByTestId('quiz-option').first();
   11 |   // Playwright cannot directly check focus on label, but can check the input inside
   12 |   const input = await firstOption.locator('input[type="radio"]');
   13 |   await expect(input).toBeFocused();
   14 | });
   15 |
   16 | test.skip('should allow keyboard navigation through options and buttons', async ({ page }) => {
   17 |   await page.goto('/');
   18 |   await page.getByLabel('Quiz Length').fill('2');
   19 |   await page.getByRole('button', { name: /start/i }).click();
   20 |   // Wait for the first radio input to be visible
   21 |   const firstRadio = page.getByTestId('quiz-option').first().locator('input[type="radio"]');
   22 |   await expect(firstRadio).toBeVisible();
   23 |   // Click the first radio and check it is selected
   24 |   await firstRadio.click();
   25 |   await expect(firstRadio).toBeChecked();
   26 |   // Use ArrowDown to move to the second radio and check it is selected
   27 |   await firstRadio.focus();
   28 |   await page.keyboard.press('ArrowDown');
   29 |   const secondRadio = page.getByTestId('quiz-option').nth(1).locator('input[type="radio"]');
   30 |   // Wait for React state to update
   31 |   await page.waitForTimeout(150);
   32 |   await expect(secondRadio).toBeChecked();
   33 |   // Tab to navigation buttons (Prev/Next/Finish)
   34 |   await page.keyboard.press('Tab');
   35 |   await page.keyboard.press('Tab');
   36 |   // Should be on Prev button
   37 |   await expect(page.getByRole('button', { name: /prev/i })).toBeFocused();
   38 | });
   39 |
   40 | test('should reset quiz and focus first option after restart', async ({ page }) => {
   41 |   await page.goto('/');
   42 |   await page.getByLabel('Quiz Length').fill('1');
   43 |   await page.getByRole('button', { name: /start/i }).click();
   44 |   await page.getByTestId('quiz-option').first().click();
   45 |   await page.getByRole('button', { name: /finish/i }).click();
>  46 |   await page.getByRole('button', { name: /start new quiz/i }).click();
      |                                                               ^ Error: locator.click: Test ended.
   47 |   const input = await page.getByTestId('quiz-option').first().locator('input[type="radio"]');
   48 |   await expect(input).toBeFocused();
   49 | });
   50 |
   51 | test('should handle edge case: no questions', async ({ page }) => {
   52 |   // Simulate no questions by intercepting API or clearing questions in test env
   53 |   // For now, just check for loading/error UI
   54 |   await page.goto('/');
   55 |   // If no questions, should show error or empty state
   56 |   // This is a placeholder, update as needed for your app's behavior
   57 |   // await expect(page.getByText(/no questions/i)).toBeVisible();
   58 | });
   59 |
   60 | test('should handle edge case: rapid answer selection', async ({ page }) => {
   61 |   await page.goto('/');
   62 |   await page.getByLabel('Quiz Length').fill('2');
   63 |   await page.getByRole('button', { name: /start/i }).click();
   64 |   const options = page.getByTestId('quiz-option');
   65 |   await options.nth(0).click();
   66 |   await options.nth(1).click();
   67 |   await options.nth(0).click();
   68 |   // Should not crash, and feedback should be shown
   69 |   await expect(page.getByTestId('quiz-feedback')).toBeVisible();
   70 | });
   71 |
   72 | test('should show explanations when enabled', async ({ page }) => {
   73 |   await page.goto('/');
   74 |   await page.getByLabel('Quiz Length').fill('1');
   75 |   await page.getByRole('button', { name: /start/i }).click();
   76 |   // Simulate enabling explanations (if toggle exists)
   77 |   // For now, check for explanation text if present
   78 |   // await expect(page.getByText(/explanation/i)).toBeVisible();
   79 | });
   80 |
   81 | test('should show topic stats in results', async ({ page }) => {
   82 |   await page.goto('/');
   83 |   await page.getByLabel('Quiz Length').fill('1');
   84 |   await page.getByRole('button', { name: /start/i }).click();
   85 |   await page.getByTestId('quiz-option').first().click();
   86 |   await page.getByRole('button', { name: /finish/i }).click();
   87 |   await expect(page.getByText(/topic stats/i)).toBeVisible();
   88 | });
   89 |
   90 | test('should render and be usable on mobile viewport', async ({ page }) => {
   91 |   await page.setViewportSize({ width: 375, height: 667 }); // iPhone 8 size
   92 |   await page.goto('/');
   93 |   await page.getByLabel('Quiz Length').fill('1');
   94 |   await page.getByRole('button', { name: /start/i }).click();
   95 |   await expect(page.getByTestId('quiz-question-card')).toBeVisible();
   96 |   // Check that options are visible and accessible
   97 |   await expect(page.getByTestId('quiz-option').first()).toBeVisible();
   98 | });
   99 |
  100 | test('should allow selecting options and navigation with keyboard and mouse', async ({ page }) => {
  101 |   await page.goto('/');
  102 |   await page.getByLabel('Quiz Length').fill('2');
  103 |   await page.getByRole('button', { name: /start/i }).click();
  104 |   // Wait for the first radio input to be visible
  105 |   const firstRadio = page.getByTestId('quiz-option').first().locator('input[type="radio"]');
  106 |   await expect(firstRadio).toBeVisible();
  107 |   // Click the first radio and check it is selected
  108 |   await firstRadio.click();
  109 |   await expect(firstRadio).toBeChecked();
  110 |   // Use ArrowDown to move to the second radio and check it is selected
  111 |   await firstRadio.focus();
  112 |   await page.keyboard.press('ArrowDown');
  113 |   const secondRadio = page.getByTestId('quiz-option').nth(1).locator('input[type="radio"]');
  114 |   // Wait for React state to update
  115 |   await page.waitForTimeout(150);
  116 |   await expect(secondRadio).toBeChecked();
  117 |   // Tab to navigation buttons (Prev/Next/Finish)
  118 |   await page.keyboard.press('Tab');
  119 |   await page.keyboard.press('Tab');
  120 |   // Should be on Prev button
  121 |   await expect(page.getByRole('button', { name: /prev/i })).toBeFocused();
  122 | });
  123 |
```