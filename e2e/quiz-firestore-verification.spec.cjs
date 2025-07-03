const admin = require('firebase-admin');
const path = require('path');
const { test, expect } = require('@playwright/test');
const fs = require('fs');

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

function getTestUser(index = 0) {
  const usersPath = path.resolve(__dirname, 'test-users.json');
  const usersRaw = fs.readFileSync(usersPath, 'utf-8');
  const users = JSON.parse(usersRaw);
  return users[index];
}

const user = getTestUser(0);
const TEST_EMAIL = user.email;
const TEST_PASSWORD = user.password;

test.describe('Quiz Firestore Verification', () => {
  test('Quiz results are saved to Firestore after submit', async ({ page }) => {
    // Capture browser console errors/warnings for debugging
    const browserLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        browserLogs.push(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
      }
    });
    // Use the shared UI sign-in helper for consistency with other tests
    const { uiSignIn } = require('./helpers/uiSignIn');
    const db = admin.firestore();
    let userUid = null;
    // Sign in and clear quizProgress for the test user
    await uiSignIn(page, { email: TEST_EMAIL, password: TEST_PASSWORD, profilePath: '/profile' });
    userUid = await page.evaluate(() => window.localStorage.getItem('firebaseUserUid'));
    if (userUid) {
      const docRef = db.collection('users').doc(userUid).collection('quizProgress').doc('current');
      await docRef.delete().catch(e => console.log('No quizProgress doc to delete:', e.message));
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
        if (errorEl) errorMsg = await errorEl.textContent();
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
    // Wait for Quiz Length input to be visible (longer timeout)
    try {
      await page.waitForSelector('[aria-label="Quiz Length"], [data-testid="quiz-length-input"]', { timeout: 20000 });
    } catch (e) {
      // Dump page content for debugging
      const content = await page.content();
      console.error('[E2E ERROR] Quiz Length input not found after 20s. Page content:', content.slice(0, 1000));
      throw e;
    }
    // Check for quiz questions after input is visible
    let questionsFound = false;
    let questionCount = 0;
    let questionDetails = [];
    // Collect all browser logs, not just errors/warnings
    const allBrowserLogs = [];
    page.on('console', msg => {
      allBrowserLogs.push(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
    });
    // Collect network requests
    const networkRequests = [];
    page.on('request', req => {
      networkRequests.push(`[REQUEST] ${req.method()} ${req.url()}`);
    });
    try {
      // Find all quiz question <option> elements inside the quiz <select>
      // Adjust selector as needed for your actual DOM structure
      const questionEls = await page.$$('select option');
      questionCount = questionEls.length;
      if (questionCount > 0) {
        questionsFound = true;
        // Get text content of each question for debug
        for (const el of questionEls) {
          try {
            const text = await el.textContent();
            questionDetails.push(text);
          } catch {}
        }
      }
    } catch (e) {
      // Ignore errors here, just log below
    }
    console.log(`[E2E DEBUG] Found ${questionCount} quiz question(s):`, questionDetails);
    if (!questionsFound) {
      const content = await page.content();
      // Dump all browser logs
      if (allBrowserLogs.length) {
        console.error('[E2E ERROR] All browser console logs after quiz load:', allBrowserLogs);
      }
      if (browserLogs.length) {
        console.error('[E2E ERROR] Browser console errors/warnings after quiz load:', browserLogs);
      }
      // Dump all network requests
      if (networkRequests.length) {
        console.error('[E2E ERROR] Network requests made by page:', networkRequests);
      }
      // Dump full page content
      console.error('[E2E ERROR] No quiz questions found after loading /quiz. FULL Page content:', content);
      throw new Error('No quiz questions found after loading /quiz. See debug logs above.');
    }
    if (browserLogs.length) {
      console.warn('[E2E WARNING] Browser console errors/warnings after quiz load:', browserLogs);
    }
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
    console.log('E2E TEST Final Firestore quizProgress:', quizProgress);
    if (!quizProgress || quizProgress.showResults !== true) {
      throw new Error('Timed out waiting for Firestore quizProgress to have showResults: true. Last state: ' + JSON.stringify(quizProgress));
    }
    expect(quizProgress).not.toBeNull();
    expect(quizProgress?.showResults).toBe(true);
    expect(Array.isArray(quizProgress?.userAnswers)).toBe(true);
    // Optionally, check more fields as needed
  });
  }, 60000);
