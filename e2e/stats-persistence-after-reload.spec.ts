// @ts-nocheck
// E2E: Stats Persistence After Reload
// Ensures stats persist and UI is correct after a full app reload

import { test, expect, Page } from '@playwright/test';
import './helpers/playwright-coverage';
import { resetUserStats } from './helpers/resetUserStats';
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

async function getStatValue(page: Page, label: string): Promise<string> {
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

test.describe('Stats Persistence After Reload', () => {
  test('should persist stats and UI after app reload', async ({ page }) => {
    const user = await getTestUser(0);
    await uiSignIn(page, { email: user.email, password: user.password });
    const userUid = await page.evaluate(() => window.localStorage.getItem('firebaseUserUid'));
    if (!userUid) throw new Error('firebaseUserUid not found in localStorage after sign-in.');
    await resetUserStats(userUid);
    await page.goto('/analytics');
    let initialQuizzesTaken = '';
    for (let i = 0; i < 10; i++) {
      initialQuizzesTaken = await getStatValue(page, 'Quizzes Taken:') || '';
      if (initialQuizzesTaken !== '') break;
      await page.waitForTimeout(500);
    }
    console.log('[E2E DEBUG] initialQuizzesTaken:', initialQuizzesTaken);
    await page.screenshot({ path: 'test-results/screenshots/quizzes-taken-initial.png', fullPage: true });
    // Take a quiz
    await page.goto('/quiz');
    await page.waitForSelector('[data-testid="quiz-start-form"]', { timeout: 15000 });
    const quizLengthInput = await page.getByLabel('Quiz Length');
    await quizLengthInput.scrollIntoViewIfNeeded();
    await quizLengthInput.fill('1');
    const startBtn = await page.getByRole('button', { name: /start/i });
    await startBtn.scrollIntoViewIfNeeded();
    await startBtn.click();
    await page.waitForSelector('[data-testid="quiz-question-card"]', { timeout: 15000 });
    const firstOption = await page.getByTestId('quiz-option').first();
    await firstOption.scrollIntoViewIfNeeded();
    await firstOption.click();
    const nextOrFinishBtn = await page.getByRole('button', { name: /next|finish/i });
    await nextOrFinishBtn.scrollIntoViewIfNeeded();
    await nextOrFinishBtn.click();
    await expect(page.getByTestId('quiz-results')).toBeVisible();
    // Check stat after quiz
    // After quiz completion, get updated stat value before reload
    await page.goto('/analytics');
    let updatedQuizzesTaken = '';
    for (let i = 0; i < 10; i++) {
      updatedQuizzesTaken = await getStatValue(page, 'Quizzes Taken:') || '';
      if (updatedQuizzesTaken !== '' && updatedQuizzesTaken !== initialQuizzesTaken) break;
      await page.waitForTimeout(500);
    }
    console.log('[E2E DEBUG] updatedQuizzesTaken:', updatedQuizzesTaken);
    await page.screenshot({ path: 'test-results/screenshots/quizzes-taken-updated.png', fullPage: true });
    // Now reload the app and check persistence
    await page.reload();
    await page.goto('/analytics');
    let quizzesTakenAfterReload = '';
    for (let i = 0; i < 10; i++) {
      quizzesTakenAfterReload = await getStatValue(page, 'Quizzes Taken:') || '';
      if (quizzesTakenAfterReload === updatedQuizzesTaken) break;
      await page.waitForTimeout(500);
    }
    console.log('[E2E DEBUG] quizzesTakenAfterReload:', quizzesTakenAfterReload, 'expected:', updatedQuizzesTaken);
    await page.screenshot({ path: 'test-results/screenshots/quizzes-taken-after-reload.png', fullPage: true });
    expect(quizzesTakenAfterReload).toBe(updatedQuizzesTaken);
    // Optionally, check for white page or error UI
    const bodyHtml = await page.content();
    expect(bodyHtml).not.toMatch(/white|error|exception|stack/i);
  });
});
