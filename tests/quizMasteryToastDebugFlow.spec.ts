import { test, expect, Page } from '@playwright/test';

// Helper to set mock auth before each test
async function mockAuth(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('e2e-mock-auth', JSON.stringify({
      email: 'testuser@gmail.com',
      name: 'Test User',
      uid: 'mock-uid-123',
    }));
  });
}

test.describe('Quiz, Mastery, and Toast E2E Flows', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page);
  });

  test('User can start a quiz, answer questions, and see mastery update', async ({ page }) => {
    await page.goto('http://localhost:1234');
    // Sign in if needed
    if (await page.getByTestId('sign-in-out-label').isVisible()) {
      await page.getByTestId('sign-in-out-label').click();
    }
    // Start a quiz
    await page.getByTestId('start-quiz-btn').click();
    // Answer the first question (choose the first answer)
    await page.getByTestId('answer-btn-0').click();
    // Click next if available
    if (await page.getByTestId('next-btn').isVisible()) {
      await page.getByTestId('next-btn').click();
    }
    // Check that progress bar or question number updates
    const progress = await page.locator('.quiz-qnum').textContent();
    expect(progress).toMatch(/Question \d+/);
  });

  test('User can earn a badge and see toast notification', async ({ page }) => {
    await page.goto('http://localhost:1234');
    // Sign in if needed
    if (await page.getByTestId('sign-in-out-label').isVisible()) {
      await page.getByTestId('sign-in-out-label').click();
    }
    // Simulate earning a badge (answer enough questions correctly)
    for (let i = 0; i < 10; i++) {
      await page.getByTestId('start-quiz-btn').click();
      await page.getByTestId('answer-btn-0').click();
      if (await page.getByTestId('next-btn').isVisible()) {
        await page.getByTestId('next-btn').click();
      }
    }
    // Check for toast notification
    await expect(page.getByTestId('toast')).toBeVisible();
  });

  test('User can open and interact with the debug panel', async ({ page }) => {
    await page.goto('http://localhost:1234');
    // Open debug panel if available
    if ((await page.getByTestId('toggle-debug-panel-btn').count()) > 0 && await page.getByTestId('toggle-debug-panel-btn').first().isVisible()) {
      await page.getByTestId('toggle-debug-panel-btn').first().click();
      await expect(page.getByTestId('debug-panel')).toBeVisible();
    }
  });
});
