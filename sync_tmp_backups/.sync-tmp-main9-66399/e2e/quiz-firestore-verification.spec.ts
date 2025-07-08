import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import admin from 'firebase-admin';
import { test, expect } from '@playwright/test';
import fs from 'fs';
import { uiSignIn } from './helpers/uiSignIn';
import { getTestUser } from './helpers/getTestUser';

// Log Firestore emulator environment
console.log('FIRESTORE_EMULATOR_HOST:', process.env.FIRESTORE_EMULATOR_HOST);
console.log('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Initialize Admin SDK only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      path.resolve(__dirname, '../serviceAccountKey.json')
    ),
  });
  // Point Firestore to emulator if env var is set
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    admin.firestore().settings({
      host: process.env.FIRESTORE_EMULATOR_HOST,
      ssl: false,
    });
    console.log('Firestore Admin SDK pointed to emulator:', process.env.FIRESTORE_EMULATOR_HOST);
  }
}

let testUser: { email: string; password: string; uid?: string };

test.describe('Quiz Firestore Verification', () => {
  test('Quiz results are saved to Firestore after submit', async ({ page }) => {
    // Capture browser console errors/warnings for debugging
    const browserLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        browserLogs.push(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
      }
    });
    // Get test user using shared helper
    testUser = await getTestUser(0);
    const db = admin.firestore();
    let userUid: string | null = null;
    // Sign in and clear quizProgress for the test user
    await uiSignIn(page, { email: testUser.email, password: testUser.password, profilePath: '/profile' });
    userUid = await page.evaluate(() => window.localStorage.getItem('firebaseUserUid'));
    if (userUid) {
      const docRef = db.collection('users').doc(userUid as string).collection('quizProgress').doc('current');
      await docRef.delete().catch((e: any) => console.log('No quizProgress doc to delete:', e.message));
      console.log('Cleared quizProgress for UID:', userUid);
    }
    // Wait for firebaseUserUid to be set in localStorage, robust to page closure
    try {
      if (!page.isClosed()) {
        await page.waitForFunction(() => !!window.localStorage.getItem('firebaseUserUid'), { timeout: 5000 });
      }
    } catch (e) {
      if (page.isClosed()) {
        console.log('Page was closed before firebaseUserUid could be set. Skipping wait.');
      } else {
        throw e;
      }
    }
    // Wait for sign-in form to disappear (robust for mobile/slow devices)
    await page.waitForSelector('[data-testid="test-signin-submit"]', { state: 'detached', timeout: 7000 });
    userUid = await page.evaluate(() => window.localStorage.getItem('firebaseUserUid'));
    // Log current URL for debugging
    const currentUrl = page.url();
    console.log('After sign-in, current URL:', currentUrl);
    console.log('E2E TEST UID:', userUid);
    expect(userUid).toBeTruthy();

    // Optionally, wait for a user-specific element or profile indicator here if available
    // e.g. await page.waitForSelector('[data-testid="profile-logged-in"]', { timeout: 5000 });

    // 2. Start and complete a quiz (robust waits for all selectors)
    // Only navigate to /quiz if not already there
    if (!page.url().includes('/quiz')) {
      await page.goto('/quiz');
      console.log('Navigated to /quiz');
    }
    // Wait a moment to ensure /quiz is loaded
    await page.waitForTimeout(1000);
    // Log URL and firebaseUserUid after navigation
    const afterQuizUrl = page.url();
    const afterQuizUid = await page.evaluate(() => window.localStorage.getItem('firebaseUserUid'));
    console.log('[E2E DEBUG] After navigation, URL:', afterQuizUrl);
    console.log('[E2E DEBUG] After navigation, firebaseUserUid:', afterQuizUid);
    // If not on /quiz, log and fail
    if (!afterQuizUrl.includes('/quiz')) {
      // Try to find any error/auth message
      let errorMsg = '';
      try {
        const errorEl = await page.$('[data-testid="auth-error"], .auth-error, .error, [role="alert"]');
        if (errorEl) {
          const text = await errorEl.textContent();
          errorMsg = text ?? '';
        }
      } catch {}
      const content = await page.content();
      if (browserLogs.length) {
        console.error('[E2E ERROR] Browser console errors/warnings after navigation:', browserLogs);
      }
      console.error('[E2E ERROR] Not on /quiz after navigation. URL:', afterQuizUrl, 'firebaseUserUid:', afterQuizUid, 'Error message:', errorMsg, 'Page content:', content.slice(0, 1000));
      throw new Error('Did not reach /quiz after navigation. See debug logs above.');
    }
    // Wait for loading spinner to disappear if present (longer timeout)
    let spinnerGone = false;
    try {
      await page.waitForSelector('[data-testid="loading-spinner"]', { state: 'detached', timeout: 20000 });
      spinnerGone = true;
    } catch (e) {
      console.warn('[E2E WARNING] Loading spinner did not disappear after 20s. Proceeding to check for quiz input.');
    }
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
    await quizLengthInput.fill('2');
    await page.getByRole('button', { name: /start/i }).click();
    // Answer first question
    const firstOption = page.getByTestId('quiz-option').first();
    await expect(firstOption).toBeVisible();
    await firstOption.click();
    await page.waitForTimeout(150);
    // Wait for Next button to be enabled, then click
    const nextBtn = page.getByRole('button', { name: /next/i });
    await expect(nextBtn).toBeEnabled({ timeout: 10000 });
    await nextBtn.click();
    // Answer second question
    const secondOption = page.getByTestId('quiz-option').first();
    await expect(secondOption).toBeVisible();
    await secondOption.click();
    await page.waitForTimeout(150);
    // Wait for Finish Quiz button to be enabled, then click
    const finishBtn = page.locator('button[aria-label="Finish quiz"]');
    await expect(finishBtn).toBeEnabled({ timeout: 10000 });
    await finishBtn.click();
    // Wait for results
    await expect(page.getByTestId('quiz-results')).toBeVisible();
    console.log('[E2E DEBUG] Quiz results visible, waiting 4s before polling Firestore...');
    await page.waitForTimeout(4000);
    console.log('[E2E DEBUG] Starting Firestore polling...');

    // 3. Verify Firestore document for quiz progress using Admin SDK
    const docRef = db.collection('users').doc(userUid as string).collection('quizProgress').doc('current');
    console.log('E2E TEST Firestore doc path:', docRef.path);
    let quizProgress: any = null;
    const retries = 25;
    const waitMs = 2000;
    let progressBar = '';
    for (let i = 0; i < retries; i++) {
      const docSnap = await docRef.get();
      quizProgress = docSnap.exists ? docSnap.data() : null;
      // Progress bar logic
      progressBar = '[' + '='.repeat(i+1) + ' '.repeat(retries - i - 1) + ']';
      process.stdout.write(`\r[E2E] Polling Firestore quizProgress ${progressBar} ${i+1}/${retries}`);
      console.log(` [E2E DEBUG] Poll #${i+1} Firestore doc:`, quizProgress);
      if (quizProgress && quizProgress.showResults === true) {
        process.stdout.write(`\n`);
        break;
      }
      await new Promise(res => setTimeout(res, waitMs));
    }
    process.stdout.write(`\n`);
    if (!quizProgress) {
      // Print all user UIDs in Firestore for debug
      const usersSnap = await db.collection('users').get();
      const userIds = usersSnap.docs.map((doc: any) => doc.id);
      console.log('[E2E DEBUG] All user UIDs in Firestore:', userIds);
    }
    console.log('E2E TEST Final Firestore quizProgress:', quizProgress);
    if (!quizProgress || quizProgress.showResults !== true) {
      throw new Error('Timed out waiting for Firestore quizProgress to have showResults: true. Last state: ' + JSON.stringify(quizProgress));
    }
    expect(quizProgress).not.toBeNull();
    expect(quizProgress?.showResults).toBe(true);
    expect(Array.isArray(quizProgress?.userAnswers)).toBe(true);
    // Optionally, check more fields as needed
  });
});

test.beforeAll(async () => {
  // No need to preload user, getTestUser is called in the test directly
});

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.context().clearCookies();
  await page.reload();
  // Use the shared UI sign-in helper for consistency with other tests
  testUser = await getTestUser(0);
  await uiSignIn(page, { email: testUser.email, password: testUser.password, profilePath: '/profile' });
  await page.goto('/quiz');
});
