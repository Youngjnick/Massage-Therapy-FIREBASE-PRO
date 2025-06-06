// @ts-nocheck
import { test, expect } from '@playwright/test';
import { mockAuth } from './helpers/e2eDebugHelpers';

test.describe('Error Handling & Recovery', () => {
  test('Simulate Firestore/network error and show error UI', async ({ page }) => {
    await mockAuth(page);
    await page.goto('/');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.evaluate(() => (window as any).waitForE2EReactReady && (window as any).waitForE2EReactReady());
    await page.evaluate(() => {
      window.fetchQuestions = async () => { throw new Error('Simulated Firestore error'); };
    });
    await page.reload();
    await expect(page.locator('body')).toContainText('Failed to load questions');
  });
  test('Simulate localStorage quota exceeded/corruption', async ({ page }) => {
    await mockAuth(page);
    await page.goto('/');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.evaluate(() => (window as any).waitForE2EReactReady && (window as any).waitForE2EReactReady());
    await page.evaluate(() => {
      // Simulate quota exceeded
      Storage.prototype.setItem = () => { throw new DOMException('QuotaExceededError', 'QuotaExceededError'); };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      try { localStorage.setItem('quizResults', '[]'); } catch { (window as any).localStorageError = true; }
    });
    await expect(page.evaluate(() => window.localStorageError)).resolves.toBe(true);
    // Simulate corruption
    await page.evaluate(() => { localStorage.setItem('quizResults', 'not-json'); });
    await page.reload();
    await expect(page.locator('body')).not.toContainText('crash');
  });
});