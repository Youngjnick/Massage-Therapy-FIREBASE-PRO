/* eslint-disable no-undef */
const admin = require('firebase-admin');
const path = require('path');
const { test, expect } = require('@playwright/test');

// Log Firestore emulator environment and add fallback for emulator host
let emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
if (!emulatorHost) {
  // Try localhost fallback if 127.0.0.1 is not set
  emulatorHost = 'localhost:8080';
  process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;
  console.warn('[E2E] FIRESTORE_EMULATOR_HOST was undefined, falling back to localhost:8080');
}
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

const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'test1234@gmail.com';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'test1234';

test.describe('Quiz Firestore Verification', () => {
  test('Quiz results are saved to Firestore after submit', async ({ page }) => {
    // Clear test user's quizProgress before test
    const db = admin.firestore();
    let userUid = null;
    // Try to get UID from previous runs if possible
    try {
      await page.goto('/profile');
      await page.waitForSelector('[data-testid="test-signin-email"]', { timeout: 10000 });
      await page.fill('[data-testid="test-signin-email"]', TEST_EMAIL);
      await page.fill('[data-testid="test-signin-password"]', TEST_PASSWORD);
      await page.click('[data-testid="test-signin-submit"]');
      await page.waitForFunction(() => !!window.localStorage.getItem('firebaseUserUid'), { timeout: 5000 });
      userUid = await page.evaluate(() => window.localStorage.getItem('firebaseUserUid'));
      if (userUid) {
        const docRef = db.collection('users').doc(userUid).collection('quizProgress').doc('current');
        await docRef.delete().catch(e => console.log('No quizProgress doc to delete:', e.message));
        console.log('Cleared quizProgress for UID:', userUid);
      }
    } catch (e) {
      console.log('Could not clear quizProgress before test:', e.message);
    }
    // 1. Go to /profile and use the test sign-in form
    await page.goto('/profile');
    await page.waitForSelector('[data-testid="test-signin-email"]', { timeout: 10000 });
    await page.fill('[data-testid="test-signin-email"]', TEST_EMAIL);
    await page.fill('[data-testid="test-signin-password"]', TEST_PASSWORD);
    await page.$eval('[data-testid="test-signin-submit"]', btn => btn.click());
    // Wait for the sign-in button to be removed from the DOM (SPA transition)
    await page.waitForSelector('[data-testid="test-signin-submit"]', { state: 'detached', timeout: 5000 });
    // Wait for firebaseUserUid to be set in localStorage
    await page.waitForFunction(() => !!window.localStorage.getItem('firebaseUserUid'), { timeout: 5000 });
    userUid = await page.evaluate(() => window.localStorage.getItem('firebaseUserUid'));
    console.log('E2E TEST UID:', userUid);
    expect(userUid).toBeTruthy();

    // 2. Start and complete a quiz (robust waits for all selectors)
    await page.goto('/');
    // Wait for Quiz Length input to be visible (works for both desktop and mobile)
    await page.waitForSelector('[aria-label="Quiz Length"], [data-testid="quiz-length-input"]', { timeout: 10000 });
    // Try both label and testid for compatibility
    let quizLengthFilled = false;
    try {
      await page.getByLabel('Quiz Length').fill('1');
      quizLengthFilled = true;
    } catch {
      // fallback to testid if label fails
      try {
        await page.getByTestId('quiz-length-input').fill('1');
        quizLengthFilled = true;
      } catch {
        console.log('Could not find Quiz Length input by label or testid');
      }
    }
    expect(quizLengthFilled).toBe(true);

    // Wait for Start button and click
    await page.waitForSelector('button, [role="button"]', { timeout: 10000 });
    await page.getByRole('button', { name: /start/i }).click();

    // Wait for quiz option and select
    await page.waitForSelector('[data-testid="quiz-option"]', { timeout: 10000 });
    await page.getByTestId('quiz-option').first().click();

    // Wait for Finish button and click
    await page.waitForSelector('button, [role="button"]', { timeout: 10000 });
    await page.getByRole('button', { name: /finish/i }).click();
    console.log('[E2E DEBUG] Clicked Finish button, waiting for results...');

    // Wait for results to be visible
    await page.waitForSelector('[data-testid="quiz-results"]', { timeout: 10000 });
    await expect(page.getByTestId('quiz-results')).toBeVisible();
    console.log('[E2E DEBUG] Quiz results visible, waiting 4s before polling Firestore...');
    await page.waitForTimeout(4000);
    console.log('[E2E DEBUG] Starting Firestore polling...');

    // 3. Verify Firestore document for quiz progress using Admin SDK
    const docRef = db.collection('users').doc(userUid).collection('quizProgress').doc('current');
    console.log('E2E TEST Firestore doc path:', docRef.path);
    let quizProgress = null;
    const retries = 40; // Increased from 25 for more reliability
    const waitMs = 3000; // Increased from 2000ms for more reliability
    let progressBar = '';
    const pollStart = Date.now();
    const pollStates = [];
    for (let i = 0; i < retries; i++) {
      const docSnap = await docRef.get();
      quizProgress = docSnap.exists ? docSnap.data() : null;
      pollStates.push({ i, quizProgress, time: Date.now() });
      // Progress bar logic with spinner and timestamp
      const spinnerFrames = ['|', '/', '-', '\\'];
      const spinner = spinnerFrames[i % spinnerFrames.length];
      progressBar = '[' + '='.repeat(i+1) + ' '.repeat(retries - i - 1) + ']';
      const elapsed = ((Date.now()-pollStart)/1000).toFixed(1);
      process.stdout.write(`\r[E2E] Polling Firestore quizProgress ${progressBar} ${i+1}/${retries} ${spinner} Elapsed: ${elapsed}s State: ${JSON.stringify(quizProgress)}`);
      if (quizProgress && quizProgress.showResults === true) {
        process.stdout.write(`\n`);
        break;
      }
      await new Promise(res => setTimeout(res, waitMs));
    }
    process.stdout.write(`\n`);
    console.log('E2E TEST Final Firestore quizProgress:', quizProgress);
    if (!quizProgress || quizProgress.showResults !== true) {
      console.log('E2E ERROR: Timed out waiting for Firestore quizProgress. All poll states:');
      for (const state of pollStates) {
        console.log(`Poll #${state.i + 1} at ${new Date(state.time).toISOString()}:`, state.quizProgress);
      }
      throw new Error('Timed out waiting for Firestore quizProgress to have showResults: true. Last state: ' + JSON.stringify(quizProgress));
    }
    expect(quizProgress).not.toBeNull();
    expect(quizProgress?.showResults).toBe(true);
    expect(Array.isArray(quizProgress?.userAnswers)).toBe(true);
    // Optionally, check more fields as needed
  });
  }, 60000);
