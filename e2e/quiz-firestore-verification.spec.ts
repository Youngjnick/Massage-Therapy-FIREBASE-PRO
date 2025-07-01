import { fileURLToPath } from 'url';
import path from 'path';
import { test, expect } from '@playwright/test';
import { execFileSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Quiz Firestore Verification', () => {
  test('Quiz results are saved to Firestore after submit', async ({ page }) => {
    // 1. Go to login page and sign in (adjust selectors as needed)
    await page.goto('/');
    if (await page.getByRole('button', { name: /sign in/i }).isVisible()) {
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForSelector('[aria-label="Profile"], [aria-label="Sign Out"]', { timeout: 15000 });
    }

    // 2. Start and complete a quiz
    await page.getByLabel('Quiz Length').fill('1');
    await page.getByRole('button', { name: /start/i }).click();
    await page.getByTestId('quiz-option').first().click();
    await page.getByRole('button', { name: /finish/i }).click();
    await expect(page.getByTestId('quiz-results')).toBeVisible();

    // 3. Get the current user's UID from the browser context
    // @ts-ignore
    const userUid = await page.evaluate(() => {
      // @ts-ignore
      return window.localStorage.getItem('firebaseUserUid') || (window.currentUser && window.currentUser.uid) || null;
    });
    expect(userUid).toBeTruthy();

    // 4. Call Node.js helper to verify Firestore quiz progress
    const scriptPath = path.resolve(__dirname, './verify-quiz-firestore.js');
    let output = '';
    try {
      output = execFileSync('node', [scriptPath, userUid], { encoding: 'utf8' });
    } catch (err) {
      const e = err as any;
      throw new Error(`Firestore verification failed: ${e.message}\n${e.stdout || ''}${e.stderr || ''}`);
    }
    expect(output.startsWith('OK')).toBe(true);
  });
});
