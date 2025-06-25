import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'test1234@gmail.com';
const TEST_PASSWORD = 'test1234';
const TOPIC = 'abdominal_muscle_origins';
const TOPIC_LABEL = 'Abdominal Muscle Origins';
const EMAIL_SELECTOR = '[data-testid="test-signin-email"]';
const PASSWORD_SELECTOR = '[data-testid="test-signin-password"]';
const SUBMIT_SELECTOR = '[data-testid="test-signin-submit"]';
const SIGNOUT_SELECTOR = 'button[aria-label="Sign out"], button:has-text("Sign Out")';

async function uiSignIn(page: import('@playwright/test').Page) {
  await page.goto('/profile');
  await page.fill(EMAIL_SELECTOR, TEST_EMAIL);
  await page.fill(PASSWORD_SELECTOR, TEST_PASSWORD);
  await page.click(SUBMIT_SELECTOR);
  await page.waitForSelector(SIGNOUT_SELECTOR, { timeout: 10000 });
}

function getTopicBreakdownRegex(topic: string) {
  // e.g., abdominal_muscle_origins1 / 1 correct (no space)
  return new RegExp(`${topic}\\s*\\d+ / \\d+ correct`);
}

test.describe('Stats Topic Breakdown', () => {
  test('should increment topic breakdown after quiz in specific topic', async ({ page }) => {
    await uiSignIn(page);
    await page.goto('/analytics');
    // Get initial topic breakdown value
    const initialText = await page.textContent('body');
    const initialMatch = initialText && initialText.match(getTopicBreakdownRegex(TOPIC));
    let initialTotal = 0;
    if (initialMatch) {
      const nums = initialMatch[0].match(/(\d+) \/ (\d+)/);
      if (nums) {
        initialTotal = parseInt(nums[2], 10);
      }
    }
    // Take a quiz in the topic
    await page.goto('/quiz');
    await page.waitForSelector('[data-testid="quiz-start-form"]', { timeout: 10000 });
    // Select topic by visible label
    const topicSelect = page.locator('[data-testid="quiz-topic-select"]');
    if (await topicSelect.count()) {
      await topicSelect.selectOption({ label: TOPIC_LABEL });
    }
    await page.getByLabel('Quiz Length').fill('1');
    await page.getByRole('button', { name: /start/i }).click();
    await page.waitForSelector('[data-testid="quiz-question-card"]', { timeout: 10000 });
    await page.getByTestId('quiz-option').first().click();
    await page.getByRole('button', { name: /next|finish/i }).click();
    await expect(page.getByTestId('quiz-results')).toBeVisible();
    // Reload analytics and check topic breakdown
    await page.goto('/analytics');
    await page.waitForTimeout(2000);
    const updatedText = await page.textContent('body');
    const updatedMatch = updatedText && updatedText.match(getTopicBreakdownRegex(TOPIC));
    expect(updatedMatch).toBeTruthy();
    if (updatedMatch) {
      const nums = updatedMatch[0].match(/(\d+) \/ (\d+)/);
      if (nums) {
        const updatedTotal = parseInt(nums[2], 10);
        expect(updatedTotal).toBeGreaterThan(initialTotal);
      }
    }
  });
});
