import { fileURLToPath } from 'url';
import path from 'path';
import { test, expect } from '@playwright/test';
import { execFileSync } from 'child_process';
import serviceAccount from '../serviceAccountKey.json' assert { type: 'json' };
import admin from 'firebase-admin';
import { uiSignIn } from './helpers/uiSignIn';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Quiz Firestore Verification', () => {
  test('Quiz results are saved to Firestore after submit', async ({ page }) => {
    // 1. Sign in using the test/dev sign-in form
    await uiSignIn(page);

    // 2. Go to home page and start quiz
    await page.goto('/');
    await page.getByLabel('Quiz Length').fill('1');
    await page.getByRole('button', { name: /start/i }).click();
    await page.getByTestId('quiz-option').first().click();
    await page.getByRole('button', { name: /finish/i }).click();
    await expect(page.getByTestId('quiz-results')).toBeVisible();

    // 3. Wait for firebaseUserUid to be set in localStorage (max 2s)
    const userUid = await page.waitForFunction(() => {
      return window.localStorage.getItem('firebaseUserUid');
    }, undefined, { timeout: 2000 }).then(res => res.jsonValue());
    expect(userUid).toBeTruthy();

    // 4. Wait for showResults:true in Firestore before running verification script
    // (avoid race condition)
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    const db = admin.firestore();
    const progressRef = db.collection('users').doc(userUid as string).collection('quizProgress').doc('current');
    let found = false;
    for (let i = 0; i < 10; i++) { // up to 10s
      const docSnap = await progressRef.get();
      const data = docSnap.exists ? docSnap.data() : undefined;
      if (data && data.showResults === true) {
        found = true;
        break;
      }
      await new Promise(res => globalThis.setTimeout(res, 1000));
    }
    expect(found).toBe(true);

    // 5. Call Node.js helper to verify Firestore quiz progress
    const scriptPath = path.resolve(__dirname, './verify-quiz-firestore.cjs');
    let output = '';
    try {
      output = execFileSync('node', [scriptPath, userUid as string], { encoding: 'utf8' });
    } catch (err) {
      const e = err as any;
      throw new Error(`Firestore verification failed: ${e.message}\n${e.stdout || ''}${e.stderr || ''}`);
    }
    expect(output.startsWith('OK')).toBe(true);
  });
});
