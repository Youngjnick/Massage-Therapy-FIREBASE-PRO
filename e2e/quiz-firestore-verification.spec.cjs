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
    // Always start with a clean session: clear localStorage and sessionStorage
    await page.goto('/profile');
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.reload();

    // 1. Go to /profile and use the test sign-in form
    await page.goto('/profile');
    // If sign-in form is not present, log diagnostics and reload once
    let signInFormFound = false;
    try {
      await page.waitForSelector('[data-testid="test-signin-email"]', { timeout: 5000 });
      signInFormFound = true;
    } catch (e) {
      const url = page.url();
      const html = await page.content();
      console.log('[E2E ERROR] Sign-in form not found after initial load. URL:', url);
      console.log('[E2E ERROR] HTML:', html);
      await page.reload();
      try {
        await page.waitForSelector('[data-testid="test-signin-email"]', { timeout: 5000 });
        signInFormFound = true;
      } catch (e2) {
        const url2 = page.url();
        const html2 = await page.content();
        console.log('[E2E ERROR] Sign-in form still not found after reload. URL:', url2);
        console.log('[E2E ERROR] HTML:', html2);
        throw new Error('Sign-in form not found after reload.');
      }
    }
    if (signInFormFound) {
      await page.fill('[data-testid="test-signin-email"]', TEST_EMAIL);
      await page.fill('[data-testid="test-signin-password"]', TEST_PASSWORD);
      await page.$eval('[data-testid="test-signin-submit"]', btn => btn.click());
    }
    // Wait for the sign-in button to be removed from the DOM (SPA transition)
    await page.waitForSelector('[data-testid="test-signin-submit"]', { state: 'detached', timeout: 5000 });
    // Wait for firebaseUserUid to be set in localStorage
    await page.waitForFunction(() => !!window.localStorage.getItem('firebaseUserUid'), { timeout: 5000 });
    userUid = await page.evaluate(() => window.localStorage.getItem('firebaseUserUid'));
    console.log('E2E TEST UID:', userUid);
    expect(userUid).toBeTruthy();

    // 2. Log and wait for user settings to be loaded before navigating to /quiz
    const userSettingsAfterSignIn = await page.evaluate(() => window.localStorage.getItem('userSettings'));
    const urlAfterSignIn = page.url();
    const browserLogsAfterSignIn = await page.evaluate(() => window.__e2eConsoleLogs || []);
    // Log all localStorage contents after sign-in for diagnostics
    const allLocalStorage = await page.evaluate(() => {
      const out = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        out[k] = localStorage.getItem(k);
      }
      return out;
    });
    console.log('[E2E DEBUG] userSettings in localStorage after sign-in:', userSettingsAfterSignIn);
    console.log('[E2E DEBUG] URL after sign-in:', urlAfterSignIn);
    console.log('[E2E DEBUG] Browser console logs after sign-in:', browserLogsAfterSignIn);
    console.log('[E2E DEBUG] All localStorage after sign-in:', allLocalStorage);
    // Wait up to 20s for userSettings key to appear
    try {
      await page.waitForFunction(() => !!window.localStorage.getItem('userSettings'), { timeout: 20000 });
      const userSettingsReady = await page.evaluate(() => window.localStorage.getItem('userSettings'));
      console.log('[E2E DEBUG] userSettings in localStorage after wait:', userSettingsReady);
    } catch (e) {
      const userSettingsTimeout = await page.evaluate(() => window.localStorage.getItem('userSettings'));
      const html = await page.content();
      const browserLogs = await page.evaluate(() => window.__e2eConsoleLogs || []);
      await page.screenshot({ path: 'test-results/user-settings-missing.png', fullPage: true });
      console.log('[E2E WARN] Timed out waiting for userSettings in localStorage. Value at timeout:', userSettingsTimeout);
      console.log('[E2E WARN] HTML at timeout:', html);
      console.log('[E2E WARN] Browser console logs at timeout:', browserLogs);
    }
    // After sign-in, dump Profile page HTML for diagnostics
    const profileHtml = await page.content();
    console.log('[E2E DEBUG] Profile page HTML after sign-in:', profileHtml);
    // Add a short delay to allow any async writes to complete
    await page.waitForTimeout(1000);

    // Wait for the Profile page to show the test user's email or UID after sign-in
    await page.waitForSelector('[data-testid="profile-uid"]', { timeout: 20000 });
    const profileUidText = await page.$eval('[data-testid="profile-uid"]', el => el.textContent);
    console.log('[E2E DEBUG] Profile UID after sign-in:', profileUidText);

    // Always navigate to /quiz after sign-in, regardless of SPA state
    await page.goto('/quiz');
    // Log browser console output after navigation
    const browserLogs = await page.evaluate(() => window.__e2eConsoleLogs || []);
    console.log('[E2E DEBUG] Browser console logs after navigating to /quiz:', browserLogs);
    // Wait for the quiz start form to be visible before looking for Quiz Length input
    let quizStartFormVisible = false;
    try {
      await page.waitForSelector('[data-testid="quiz-start-form"]', { timeout: 10000 });
      quizStartFormVisible = true;
    } catch (e) {
      const html = await page.content();
      const allLabels = await page.$$eval('label', (labels) => labels.map(l => l.textContent));
      const allButtons = await page.$$eval('button', (btns) => btns.map(b => b.textContent));
      console.log('[E2E ERROR] Quiz start form not found after 10s. Dumping HTML, labels, and buttons...');
      console.log('[E2E ERROR] HTML:', html);
      console.log('[E2E ERROR] All labels:', allLabels);
      console.log('[E2E ERROR] All buttons:', allButtons);
      throw new Error('Quiz start form not found on /quiz');
    }
    // Wait for Quiz Length input to be visible (works for both desktop and mobile)
    console.log('[E2E DEBUG] About to wait for Quiz Length input selector...');
    let quizLengthInputVisible = false;
    try {
      console.log('[E2E DEBUG] Waiting for Quiz Length input selector...');
      await page.waitForSelector('[aria-label="Quiz Length"], [data-testid="quiz-length-input"]', { timeout: 10000 });
      console.log('[E2E DEBUG] Quiz Length input selector found!');
      quizLengthInputVisible = true;
    } catch (e) {
      console.log('[E2E DEBUG] Quiz Length input selector NOT found, entering catch block...');
      const html = await page.content();
      const bodyHtml = await page.$eval('body', el => el.innerHTML).catch(() => '[body not found]');
      const allLabels = await page.$$eval('label', (labels) => labels.map(l => l.textContent));
      const allButtons = await page.$$eval('button', (btns) => btns.map(b => b.textContent));
      const consoleLogs = await page.evaluate(() => window.__e2eConsoleLogs || []);
      console.log('[E2E ERROR] Quiz Length input not found after 10s. Dumping HTML, BODY, labels, buttons, and console logs...');
      console.log('[E2E ERROR] HTML:', html);
      console.log('[E2E ERROR] BODY:', bodyHtml);
      console.log('[E2E ERROR] All labels:', allLabels);
      console.log('[E2E ERROR] All buttons:', allButtons);
      console.log('[E2E ERROR] Browser console logs:', consoleLogs);
      throw new Error('Quiz Length input not found on /quiz');
    }
    // Try both label and testid for compatibility
    let quizLengthFilled = false;
    if (quizLengthInputVisible) {
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
