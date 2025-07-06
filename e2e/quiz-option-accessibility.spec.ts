import { test, expect } from '@playwright/test';
import { uiSignIn } from './helpers/uiSignIn';
import { getTestUser } from './helpers/getTestUser';

const log = (...args: any[]) => {
  
  (globalThis.console || console).log(...args);
};

let testUser: { email: string; password: string; uid?: string };
test.beforeAll(async () => {
  testUser = await getTestUser(0);
});

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.context().clearCookies();
  await page.reload();
  await uiSignIn(page, { email: testUser.email, password: testUser.password, profilePath: '/profile' });
  await page.goto('/quiz');
});

test.describe('Quiz Option Accessibility', () => {
  test('Each quiz option has correct ARIA attributes and is keyboard accessible', async ({ page }) => {
    await page.goto('/');
    // Wait for Quiz Length input to be visible and enabled, with debug output
    let quizLengthInput;
    try {
      quizLengthInput = await page.waitForSelector('input[aria-label="Quiz Length"]:not([disabled])', { timeout: 15000 });
      if (!quizLengthInput) throw new Error('Quiz Length input not found');
      const visible = await quizLengthInput.isVisible();
      const enabled = await quizLengthInput.isEnabled();
      if (!visible || !enabled) {
        throw new Error(`Quiz Length input not visible/enabled. visible=${visible}, enabled=${enabled}`);
      }
    } catch (e) {
      log('Quiz Length input not found or not enabled:', e);
      const html = await page.content();
      log('Page HTML at failure:', html);
      throw e;
    }
    await quizLengthInput.fill('2');
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
      log('Quiz option ARIA attributes:', attrs);
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
