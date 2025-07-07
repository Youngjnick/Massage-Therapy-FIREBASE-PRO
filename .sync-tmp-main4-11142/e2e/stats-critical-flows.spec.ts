// @ts-nocheck
import { test, expect } from '@playwright/test';
/* global console */
import { uiSignIn } from './helpers/uiSignIn';
import fs from 'fs/promises';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
async function getTestUser(index = 0) {
  const usersPath = path.resolve(__dirname, 'test-users.json');
  const usersRaw = await fs.readFile(usersPath, 'utf-8');
  const users = JSON.parse(usersRaw);
  return users[index];
}

async function getStatValue(page: import('@playwright/test').Page, label: string): Promise<string> {
  const statLocator = page.locator(`strong:text-is('${label}')`);
  const statCount = await statLocator.count();
  if (statCount === 0) return '';
  const parent = await statLocator.first().evaluateHandle(el => el.parentElement);
  if (parent) {
    const value = await parent.evaluate((parentEl, labelText) => {
      if (!parentEl) return '';
      let found = false;
      const children = parentEl.childNodes;
      for (let i = 0; i < children.length; i++) {
        const node = children[i];
        if (found) {
          if (node.nodeType === Node.TEXT_NODE) {
            const txt = node.textContent?.trim();
            if (txt) return txt;
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const txt = (node as HTMLElement).innerText?.trim();
            if (txt) return txt;
          }
        }
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          (node as HTMLElement).tagName === 'STRONG' &&
          (node as HTMLElement).innerText.trim() === labelText
        ) {
          found = true;
        }
      }
      return '';
    }, label);
    return typeof value === 'string' ? value : '';
  }
  return '';
}

test.describe('Stats Critical Flows', () => {
  test('should increment Quizzes Taken after each quiz', async ({ page }) => {
    const user = await getTestUser(0);
    await uiSignIn(page, { email: user.email, password: user.password, profilePath: '/profile' });
    await page.goto('/analytics');
    // Get initial stat
    let initialQuizzesTaken = '';
    for (let i = 0; i < 10; i++) {
      initialQuizzesTaken = await getStatValue(page, 'Quizzes Taken:') || '';
      if (initialQuizzesTaken) break;
      await page.waitForTimeout(500);
    }
    const userUid = await page.evaluate(() => window.localStorage.getItem('firebaseUserUid'));
    console.log('[E2E DEBUG] initialQuizzesTaken:', initialQuizzesTaken, 'userUid:', userUid);
    const initial = parseInt(initialQuizzesTaken, 10) || 0;
    // Take two quizzes
    let lastStat = initial;
    for (let quizNum = 0; quizNum < 2; quizNum++) {
      await page.goto('/quiz');
      await page.waitForSelector('[data-testid="quiz-start-form"]', { timeout: 10000 });
      // Wait for Quiz Length input
      const quizLengthInput = await page.waitForSelector('input[aria-label="Quiz Length"]:not([disabled])', { timeout: 10000 });
      // Select a specific real topic for topic breakdowns
      const TARGET_TOPIC_LABEL = 'Abdominal Muscle Origins';
      const TARGET_TOPIC_VALUE = 'abdominal_muscle_origins';
      let selected = false;
      // Select the first real topic (not empty/Other) if topic select is present
      const topicSelect = page.locator('#quiz-topic-select, [data-testid="quiz-topic-select"]');
      if (await topicSelect.count() > 0) {
        const options = await topicSelect.locator('option').all();
        // Try to select by value first
        for (const opt of options) {
          const val = await opt.getAttribute('value');
          if (val === TARGET_TOPIC_VALUE) {
            await topicSelect.selectOption(val);
            console.log('[E2E DEBUG] Selected topic value (by value):', val);
            selected = true;
            break;
          }
        }
        // If not found by value, try by label
        if (!selected) {
          for (const opt of options) {
            const label = (await opt.textContent())?.trim();
            if (label === TARGET_TOPIC_LABEL) {
              const val = await opt.getAttribute('value');
              if (val) {
                await topicSelect.selectOption(val);
                console.log('[E2E DEBUG] Selected topic value (by label):', val);
                selected = true;
                break;
              }
            }
          }
        }
        // Fallback: select first valid topic (not empty/Other)
        if (!selected) {
          for (const opt of options) {
            const val = await opt.getAttribute('value');
            if (val && val !== '' && val.toLowerCase() !== 'other') {
              await topicSelect.selectOption(val);
              console.log('[E2E DEBUG] Selected topic value (fallback):', val);
              break;
            }
          }
        }
      }
      await quizLengthInput.fill('1');
      await page.getByRole('button', { name: /start/i }).click();
      await page.waitForSelector('[data-testid="quiz-question-card"]', { timeout: 10000 });
      // Loop: answer and click next/finish until results
      while (true) {
        const quizOption = page.getByTestId('quiz-option').first();
        await expect(quizOption).toBeVisible({ timeout: 10000 });
        await expect(quizOption).toBeEnabled();
        await quizOption.click();
        await page.waitForTimeout(150);
        // Prefer next button if present, else finish
        const nextBtn = page.getByRole('button', { name: /next/i });
        if (await nextBtn.count() > 0 && await nextBtn.first().isEnabled()) {
          await nextBtn.first().click();
        } else {
          const finishBtn = page.locator('button[aria-label="Finish quiz"]');
          if (await finishBtn.isVisible() && await finishBtn.isEnabled()) {
            await finishBtn.click();
            break;
          }
        }
      }
      await expect(page.getByTestId('quiz-results')).toBeVisible();
      // Extra debug: check if quiz is marked complete in UI
      const quizResultsText = await page.getByTestId('quiz-results').textContent();
      console.log(`[E2E DEBUG] quizResultsText after quiz #${quizNum+1}:`, quizResultsText);
      // After quiz completion, poll for stat update
      let updated = false;
      let polledStat = lastStat;
      for (let poll = 0; poll < 60; poll++) { // Increased polling attempts
        await page.goto('/analytics');
        await page.waitForTimeout(2000); // Increased wait time
        polledStat = parseInt(await getStatValue(page, 'Quizzes Taken:') || '0', 10);
        const polledUid = await page.evaluate(() => window.localStorage.getItem('firebaseUserUid'));
        console.log(`[E2E DEBUG] Poll #${poll+1} after quiz: Quizzes Taken:`, polledStat, 'userUid:', polledUid);
        if (polledStat > lastStat) {
          updated = true;
          break;
        }
      }
      if (!updated) {
        throw new Error(`Quizzes Taken stat did not increment after quiz #${quizNum+1}. Last stat: ${lastStat}, Polled stat: ${polledStat}`);
      }
      lastStat = polledStat;
    }
  });

  test('should allow early quiz completion with Finish (aria-label finish early) and show results', async ({ page }) => {
    const user = await getTestUser(0);
    await uiSignIn(page, { email: user.email, password: user.password, profilePath: '/profile' });
    await page.goto('/quiz');
    await page.waitForSelector('[data-testid="quiz-start-form"]', { timeout: 10000 });
    await page.getByLabel('Quiz Length').fill('2');
    await page.getByRole('button', { name: /start/i }).click();
    await page.waitForSelector('[data-testid="quiz-question-card"]', { timeout: 10000 });
    // Answer first question only
    const quizOption = page.getByTestId('quiz-option').first();
    await expect(quizOption).toBeVisible({ timeout: 10000 });
    await expect(quizOption).toBeEnabled();
    await quizOption.click();
    // Click Finish with aria-label 'Finish quiz early'
    const finishEarlyBtn = page.locator('button[aria-label="Finish quiz early"]');
    await expect(finishEarlyBtn).toBeVisible();
    await finishEarlyBtn.click();
    await expect(page.getByTestId('quiz-results')).toBeVisible();
    const quizResultsText = await page.getByTestId('quiz-results').textContent();
    console.log('[E2E DEBUG] quizResultsText after early finish:', quizResultsText);
  });

  test('should submit a completed quiz with Finish (aria-label finish quiz) and show results', async ({ page }) => {
    const user = await getTestUser(0);
    await uiSignIn(page, { email: user.email, password: user.password, profilePath: '/profile' });
    await page.goto('/quiz');
    await page.waitForSelector('[data-testid="quiz-start-form"]', { timeout: 10000 });
    await page.getByLabel('Quiz Length').fill('1');
    await page.getByRole('button', { name: /start/i }).click();
    await page.waitForSelector('[data-testid="quiz-question-card"]', { timeout: 10000 });
    // Answer the only question
    const quizOption = page.getByTestId('quiz-option').first();
    await expect(quizOption).toBeVisible({ timeout: 10000 });
    await expect(quizOption).toBeEnabled();
    await quizOption.click();
    // Click Finish with aria-label 'Finish quiz'
    const finishBtn = page.locator('button[aria-label="Finish quiz"]');
    await expect(finishBtn).toBeVisible();
    await finishBtn.click();
    await expect(page.getByTestId('quiz-results')).toBeVisible();
    const quizResultsText = await page.getByTestId('quiz-results').textContent();
    console.log('[E2E DEBUG] quizResultsText after normal finish:', quizResultsText);
  });
});
