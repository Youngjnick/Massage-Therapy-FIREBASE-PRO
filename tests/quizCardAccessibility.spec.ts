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

test.describe('QuizCard Accessibility', () => {
  test('QuizCard is keyboard accessible and has correct ARIA attributes', async ({ page }) => {
    await mockAuth(page);
    await page.goto('/');
    // Wait for topic dropdown
    await page.waitForSelector('.control[data-topic]');
    await page.selectOption('.control[data-topic]', { index: 1 });
    await page.selectOption('.control[data-quiz-length]', { value: '5' });
    await page.click('.start-btn');
    await page.waitForSelector('.quiz-card');
    // Focus should be on quiz card
    const quizCard = await page.$('.quiz-card');
    expect(quizCard).not.toBeNull();
    if (quizCard) {
      expect(await quizCard.getAttribute('role')).toBe('region');
      expect(await quizCard.getAttribute('aria-label')).toBe('Quiz Card');
    }
    // Tab to first answer button
    await page.keyboard.press('Tab');
    const active = await page.evaluate(() => document.activeElement?.className);
    expect(active).toContain('answer-btn');
    // Check aria-label on answer button
    const btn = await page.$('.answer-btn');
    expect(btn).not.toBeNull();
    if (btn) {
      expect(await btn.getAttribute('aria-label')).toMatch(/Answer 1:/);
    }
    // Tab to bookmark button
    await page.keyboard.press('Tab');
    const bookmarkBtn = await page.$('.bookmark-btn');
    expect(bookmarkBtn).not.toBeNull();
    if (bookmarkBtn) {
      expect(await bookmarkBtn.getAttribute('aria-label')).toMatch(/bookmark/i);
    }
  });
});
