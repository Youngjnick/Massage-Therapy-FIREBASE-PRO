import { test, expect } from '@playwright/test';

const log = (...args: any[]) => {
  
  (globalThis.console || console).log(...args);
};

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
      // Print all ARIA attributes for debug
      const attrs = await option.evaluate(el => {
        const input = el as HTMLInputElement;
        return {
          role: input.getAttribute('role'),
          ariaLabel: input.getAttribute('aria-label'),
          ariaChecked: input.getAttribute('aria-checked'),
          ariaDisabled: input.getAttribute('aria-disabled'),
          tabIndex: input.getAttribute('tabindex'),
          id: input.id,
          name: input.getAttribute('name'),
          checked: input.checked,
          disabled: input.disabled,
        };
      });
      log(`[E2E DEBUG] Quiz option ${i}:`, attrs);
      // Check role
      expect(attrs.role).toBe('radio');
      // Check aria-label
      expect(attrs.ariaLabel).toMatch(/^Option [A-Z]:/);
      // Check aria-checked
      expect(['true', 'false']).toContain(attrs.ariaChecked);
      // Check aria-disabled
      expect(['true', 'false', null]).toContain(attrs.ariaDisabled);
      if (attrs.ariaDisabled !== 'true') {
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
