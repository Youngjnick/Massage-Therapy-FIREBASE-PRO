import { test, expect } from '@playwright/test';
import { setTestStateWithWait, waitForAppReady } from './helpers/e2eDebugHelpers';

test.describe('Bookmark Sync Toast', () => {
  test('shows sync status toast when syncing bookmarks', async ({ page }) => {
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
    await setTestStateWithWait(page, {
      questions: [
        {
          id: 'test-q1',
          question: 'What is the capital of France?',
          answers: ['Paris', 'London', 'Berlin', 'Rome'],
          correct: 0,
          topic: 'geography',
          unit: 'europe'
        }
      ]
    });
    // Wait for quiz card to appear (robust selector)
    await page.waitForSelector('[data-testid="quiz-card"]', { state: 'visible', timeout: 10000 });
    // Wait for quiz question to appear (robust selector)
    await page.waitForSelector('[data-testid="quiz-question"]', { state: 'visible', timeout: 5000 });
    // Wait for bookmark button to be visible and enabled
    const bookmarkBtn = page.locator('[data-testid="bookmark-btn"]').first();
    await expect(bookmarkBtn).toBeVisible({ timeout: 5000 });
    await expect(bookmarkBtn).toBeEnabled({ timeout: 5000 });
    // Simulate a bookmark action to trigger sync
    await bookmarkBtn.click();
    // Wait a moment for toast to appear
    await page.waitForTimeout(500);
    // The sync toast should appear at the top
    const toast = page.locator('[class~="bookmark-sync-status"]');
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toHaveText(/syncing bookmarks/i);
    // Wait for it to disappear (sync complete)
    await toast.waitFor({ state: 'detached', timeout: 5000 });
  });

  test('shows error toast if sync fails', async ({ page }) => {
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
    await setTestStateWithWait(page, {
      questions: [
        {
          id: 'test-q1',
          question: 'What is the capital of France?',
          answers: ['Paris', 'London', 'Berlin', 'Rome'],
          correct: 0,
          topic: 'geography',
          unit: 'europe'
        }
      ]
    });
    await page.evaluate(() => {
      window.__FORCE_BOOKMARK_SYNC_ERROR__ = true;
    });
    // Wait for quiz card to appear (robust selector)
    await page.waitForSelector('[data-testid="quiz-card"]', { state: 'visible', timeout: 10000 });
    // Wait for quiz question to appear (robust selector)
    await page.waitForSelector('[data-testid="quiz-question"]', { state: 'visible', timeout: 5000 });
    // Wait for bookmark button to be visible and enabled
    const bookmarkBtn = page.locator('[data-testid="bookmark-btn"]').first();
    await expect(bookmarkBtn).toBeVisible({ timeout: 5000 });
    await expect(bookmarkBtn).toBeEnabled({ timeout: 5000 });
    await bookmarkBtn.click();
    // Wait a moment for toast to appear
    await page.waitForTimeout(500);
    const errorToast = page.locator('[class~="bookmark-sync-error"]');
    await expect(errorToast).toBeVisible({ timeout: 5000 });
    await expect(errorToast).toHaveText(/bookmark sync error/i);
  });
});
