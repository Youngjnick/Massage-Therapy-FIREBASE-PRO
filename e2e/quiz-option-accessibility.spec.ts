import { test, expect } from '@playwright/test';

test.describe('Quiz Option Accessibility', () => {
  test('Each quiz option has correct ARIA attributes and is keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Quiz Length').fill('2');
    await page.getByRole('button', { name: /start/i }).click();
    await expect(page.getByTestId('quiz-question-card')).toBeVisible();
    const options = page.getByTestId('quiz-radio');
    const count = await options.count();
    for (let i = 0; i < count; i++) {
      const option = options.nth(i);
      // Check role
      expect(await option.getAttribute('role')).toBe('radio');
      // Check aria-label
      const ariaLabel = await option.getAttribute('aria-label');
      expect(ariaLabel).toMatch(/^Option [A-Z]:/);
      // Check aria-checked
      const ariaChecked = await option.getAttribute('aria-checked');
      expect(['true', 'false']).toContain(ariaChecked);
      // Check aria-disabled
      const ariaDisabled = await option.getAttribute('aria-disabled');
      expect(['true', 'false', null]).toContain(ariaDisabled);
      if (ariaDisabled !== 'true') {
        // Keyboard: Tab to option and check focus
        await option.focus();
        await expect(option).toBeFocused();
        // Space/Enter selects the option
        await page.keyboard.press(' ');
        expect(await option.isChecked()).toBeTruthy();
      }
    }
  });
});
