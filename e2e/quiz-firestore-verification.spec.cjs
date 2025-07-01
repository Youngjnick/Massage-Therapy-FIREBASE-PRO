/* eslint-disable no-undef */
const admin = require('firebase-admin');
const path = require('path');
const { test, expect } = require('@playwright/test');

// Initialize Admin SDK only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      path.resolve(__dirname, '../serviceAccountKey.json')
    ),
  });
}

const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'test1234@gmail.com';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'test1234';

test.describe('Quiz Firestore Verification', () => {
  test('Quiz results are saved to Firestore after submit', async ({ page }) => {
    // 1. Go to /profile and use the test sign-in form
    await page.goto('/profile');
    await page.waitForSelector('[data-testid="test-signin-email"]', { timeout: 10000 });
    await page.fill('[data-testid="test-signin-email"]', TEST_EMAIL);
    await page.fill('[data-testid="test-signin-password"]', TEST_PASSWORD);
    await page.click('[data-testid="test-signin-submit"]');
    // Wait for testUid to be set in localStorage
    await page.waitForFunction(() => !!window.localStorage.getItem('testUid'), { timeout: 5000 });
    const userUid = await page.evaluate(() => window.localStorage.getItem('testUid'));
    expect(userUid).toBeTruthy();

    // 2. Start and complete a quiz
    await page.goto('/');
    await page.getByLabel('Quiz Length').fill('1');
    await page.getByRole('button', { name: /start/i }).click();
    await page.getByTestId('quiz-option').first().click();
    await page.getByRole('button', { name: /finish/i }).click();
    await expect(page.getByTestId('quiz-results')).toBeVisible();

    // 3. Verify Firestore document for quiz progress using Admin SDK
    const db = admin.firestore();
    const docRef = db.collection('users').doc(userUid).collection('quizProgress').doc('current');
    let docSnap = await docRef.get();
    let quizProgress = docSnap.data();
    console.log('Firestore quizProgress (initial):', quizProgress);
    let retries = 5;
    while (quizProgress && quizProgress.showResults !== true && retries-- > 0) {
      await new Promise(res => setTimeout(res, 1000));
      docSnap = await docRef.get();
      quizProgress = docSnap.data();
      console.log('Polling Firestore quizProgress:', quizProgress);
    }
    expect(quizProgress).not.toBeNull();
    expect(quizProgress?.showResults).toBe(true);
    expect(Array.isArray(quizProgress?.userAnswers)).toBe(true);
    // Optionally, check more fields as needed
  });
});
