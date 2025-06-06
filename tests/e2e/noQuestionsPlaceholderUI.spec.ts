// @ts-nocheck
import { test, expect } from '@playwright/test';
import { setTestStateWithWait, waitForAppReady } from './helpers/e2eDebugHelpers';

test.describe('No Questions Placeholder UI', () => {
  test('Shows placeholder or empty state if no questions loaded', async ({ page }) => {
    await page.addInitScript(() => {
      window.__E2E_TEST__ = true;
      window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
        email: 'testuser@gmail.com',
        name: 'Test User',
        uid: 'mock-uid-123',
      }));
    });
    await page.goto('/');
    await waitForAppReady(page);
    await setTestStateWithWait(page, { questions: [] });
    // Check for any of the possible empty state indicators
    const possibleSelectors = ['.no-questions', '.empty-state', '#questionList'];
    let found = false;
    for (const sel of possibleSelectors) {
      if (await page.locator(sel).count() > 0) {
        const text = await page.locator(sel).textContent();
        if (text && /no questions|empty|add questions/i.test(text)) {
          found = true;
          break;
        }
      }
    }
    expect(found).toBe(true);
  });
});