/* eslint-disable no-undef */
const admin = require('firebase-admin');
const path = require('path');
const { test, expect } = require('@playwright/test');

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
    await page.click('[data-testid="test-signin-submit"]');
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
    } catch (e) {
      // fallback to testid if label fails
      try {
        await page.getByTestId('quiz-length-input').fill('1');
        quizLengthFilled = true;
      } catch (e2) {
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

    // Wait for results to be visible
    await page.waitForSelector('[data-testid="quiz-results"]', { timeout: 10000 });
    await expect(page.getByTestId('quiz-results')).toBeVisible();

    // 3. Verify Firestore document for quiz progress using Admin SDK
    const docRef = db.collection('users').doc(userUid).collection('quizProgress').doc('current');
    console.log('E2E TEST Firestore doc path:', docRef.path);
    let docSnap = await docRef.get();
    let quizProgress = docSnap.data();
    console.log('Firestore quizProgress (initial):', quizProgress);
    let retries = 10;
    while (quizProgress && quizProgress.showResults !== true && retries-- > 0) {
      await new Promise(res => setTimeout(res, 1500));
      docSnap = await docRef.get();
      quizProgress = docSnap.data();
      console.log('Polling Firestore quizProgress:', quizProgress);
    }
    console.log('E2E TEST Final Firestore quizProgress:', quizProgress);
    expect(quizProgress).not.toBeNull();
    expect(quizProgress?.showResults).toBe(true);
    expect(Array.isArray(quizProgress?.userAnswers)).toBe(true);
    // Optionally, check more fields as needed
  });
});
