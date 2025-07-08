import { test, expect } from '@playwright/test';
import { uiSignIn } from './helpers/uiSignIn';
import fs from 'fs/promises';
import path from 'path';
import './helpers/playwright-coverage';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
async function getTestUser(index = 0) {
  const usersPath = path.resolve(__dirname, 'test-users.json');
  const usersRaw = await fs.readFile(usersPath, 'utf-8');
  const users = JSON.parse(usersRaw);
  return users[index];
}

const TOPIC = 'abdominal_muscle_origins';
const TOPIC_LABEL = 'Abdominal Muscle Origins';
function getTopicBreakdownRegex(label: string) {
  // e.g., Abdominal Muscle Origins1 / 1
  return new RegExp(`${label}\\s*\\d+ / \\d+`);
}

test.describe('Stats Topic Breakdown', () => {
  test('should increment topic breakdown after quiz in specific topic', async ({ page }) => {
    const user = await getTestUser(0);
    await uiSignIn(page, { email: user.email, password: user.password });
    await page.goto('/analytics');
    // Get initial topic breakdown value
    const initialText = await page.textContent('body');
    console.log('[E2E DEBUG] Initial analytics text:', initialText);
    const initialMatch = initialText && initialText.match(getTopicBreakdownRegex(TOPIC_LABEL));
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
    console.log('[E2E DEBUG] Updated analytics text:', updatedText);
    const updatedMatch = updatedText && updatedText.match(getTopicBreakdownRegex(TOPIC_LABEL));
    expect(updatedMatch).toBeTruthy();
    if (updatedMatch) {
      const nums = updatedMatch[0].match(/(\d+) \/ (\d+)/);
      if (nums) {
        const updatedTotal = parseInt(nums[2], 10);
        console.log('[E2E DEBUG] initialTotal:', initialTotal, 'updatedTotal:', updatedTotal);
        expect(updatedTotal).toBeGreaterThan(initialTotal);
      }
    }
  });
});
