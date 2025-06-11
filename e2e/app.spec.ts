import { test, expect } from '@playwright/test';

// Only run the failing test for now
test('should focus first option after starting quiz', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Quiz Length').fill('1');
  await page.getByLabel(/topic/i).selectOption({ index: 0 });
  await page.getByRole('button', { name: /start/i }).click();
  const firstOption = page.getByTestId('quiz-option').first();
  // Playwright cannot directly check focus on label, but can check the input inside
  const input = await firstOption.locator('input[type="radio"]');
  await expect(input).toBeFocused();
});
