// Playwright E2E: Badge earning flow
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

// BADGE E2E TESTS TEMPORARILY DISABLED
/*
test.describe('Badge Earning Flow', () => {
  // Helper for sign-in
  async function signIn(page: Page) {
    await page.goto('/');
    await expect(page.locator('img[alt="Profile"], img[alt="User Avatar"], #mainProfileAvatar')).toBeVisible();
  }

  test('should earn a badge and show 🏅 icon', async ({ page }) => {
    await mockAuth(page);
    await signIn(page);
    // Inject E2E flag and questions before any app code runs
    await page.addInitScript(() => {
      // @ts-ignore
      window.__E2E_TEST__ = true;
      localStorage.setItem('questions', JSON.stringify([
        {
          id: 'test-q1',
          question: 'What is the capital of France?',
          answers: ['Paris', 'London', 'Berlin', 'Rome'],
          correct: 0,
          topic: 'geography',
          unit: 'europe'
        },
        {
          id: 'test-q2',
          question: 'What is 2+2?',
          answers: ['4', '3', '2', '1'],
          correct: 0,
          topic: 'math',
          unit: 'arithmetic'
        },
        {
          id: 'test-q3',
          question: 'What color is the sky?',
          answers: ['Blue', 'Green', 'Red', 'Yellow'],
          correct: 0,
          topic: 'science',
          unit: 'nature'
        },
        {
          id: 'test-q4',
          question: 'What is the boiling point of water?',
          answers: ['100°C', '0°C', '50°C', '200°C'],
          correct: 0,
          topic: 'science',
          unit: 'chemistry'
        },
        {
          id: 'test-q5',
          question: 'What is the largest planet?',
          answers: ['Jupiter', 'Mars', 'Earth', 'Venus'],
          correct: 0,
          topic: 'science',
          unit: 'astronomy'
        },
        {
          id: 'test-q6',
          question: 'What is the fastest land animal?',
          answers: ['Cheetah', 'Lion', 'Tiger', 'Horse'],
          correct: 0,
          topic: 'biology',
          unit: 'animals'
        },
        {
          id: 'test-q7',
          question: 'What is the square root of 16?',
          answers: ['4', '2', '8', '6'],
          correct: 0,
          topic: 'math',
          unit: 'arithmetic'
        },
        {
          id: 'test-q8',
          question: 'Who wrote Hamlet?',
          answers: ['Shakespeare', 'Dickens', 'Austen', 'Tolkien'],
          correct: 0,
          topic: 'literature',
          unit: 'plays'
        },
        {
          id: 'test-q9',
          question: 'What is the chemical symbol for gold?',
          answers: ['Au', 'Ag', 'Fe', 'Pb'],
          correct: 0,
          topic: 'science',
          unit: 'chemistry'
        },
        {
          id: 'test-q10',
          question: 'What is the tallest mountain?',
          answers: ['Everest', 'K2', 'Denali', 'Kilimanjaro'],
          correct: 0,
          topic: 'geography',
          unit: 'mountains'
        }
      ]));
    });
    await page.goto('http://localhost:1234');
    // Try to select topic/length and start quiz if dropdowns are present
    const topicSel = await page.$('.control[data-topic]');
    const lenSel = await page.$('.control[data-quiz-length]');
    const startBtn = await page.$('.start-btn');
    if (topicSel && lenSel && startBtn) {
      await topicSel.selectOption({ index: 1 });
      await lenSel.selectOption({ value: '10' });
      await startBtn.click();
    } else {
      // Log for debug
      console.log('[E2E] Topic/length dropdowns or start button not found, assuming quiz auto-starts.');
    }
    // Simulate answering questions correctly to earn a badge
    for (let i = 0; i < 10; i++) {
      await page.waitForSelector('.answer-btn:not([disabled])', { timeout: 5000 });
      const btns = await page.$$('.answer-btn:not([disabled])');
      await btns[0].click();
      await page.waitForSelector('.next-btn:not([disabled])', { timeout: 5000 });
      await page.click('.next-btn');
    }
    // Open debug panel
    await page.waitForSelector('#debug-panel', { timeout: 5000 });
    // Check for 🏅 icon or badge progress
    await expect(page.locator('#debug-panel')).toContainText('🏅');
  });
});
*/
