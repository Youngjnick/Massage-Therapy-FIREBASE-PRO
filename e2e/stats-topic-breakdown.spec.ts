import { test, expect } from '@playwright/test';
import { uiSignIn } from './helpers/uiSignIn';

const TOPIC = 'abdominal_muscle_origins';
const TOPIC_LABEL = 'Abdominal Muscle Origins';

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
