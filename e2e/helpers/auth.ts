// @ts-nocheck
// e2e/helpers/auth.ts
import fs from 'fs';
import path from 'path';

// Import firebaseConfig from your app config
import { firebaseConfig } from '../../src/firebase/firebaseConfig';

/* eslint-disable */
// @ts-nocheck

// Add explicit types for Playwright helper
/**
 * Programmatic Firebase sign-in for Playwright E2E tests using modular SDK
 * @param {import('@playwright/test').Page} page
 */
export async function signInWithCustomToken(page) {
  const customToken = fs.readFileSync(path.resolve(__dirname, '../../test-custom-token.txt'), 'utf8');
  await page.goto('/');
  await page.addInitScript(({ config, token }) => {
    // Use modular SDK for sign-in
    (async () => {
      // Dynamically load Firebase modular SDK
      if (!window.firebaseModularLoaded) {
        const appModule = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js');
        const authModule = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js');
        window.firebaseModularLoaded = true;
        window.firebaseApp = appModule.initializeApp(config);
        window.firebaseAuth = authModule.getAuth(window.firebaseApp);
      }
      const { signInWithCustomToken } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js');
      await signInWithCustomToken(window.firebaseAuth, token);
    })();
  }, { config: firebaseConfig, token: customToken });
  await page.waitForTimeout(1500);
}
