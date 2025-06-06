// @ts-nocheck
import { test, expect } from '@playwright/test';
import { setTestStateWithWait, waitForAppReady } from './helpers/e2eDebugHelpers';

test.describe('Firestore Fetch Error UI', () => {
  test('Shows error UI if Firestore fetch fails', async ({ page }) => {
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
    // Simulate fetchQuestions throwing an error
    await page.evaluate(() => {
      window.fetchQuestions = async () => { throw new Error('Simulated Firestore error'); };
    });
    await page.reload();
    // Look for the error message in the UI
    await expect(page.locator('body')).toContainText(/failed to load questions/i);
  });
});