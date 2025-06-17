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
 * Programmatic Firebase sign-in for Playwright E2E tests
 * @param {import('@playwright/test').Page} page
 * @param {{ token: string, config: any }} opts
 */
export async function signInWithCustomToken(page, { token, config }) {
  const customToken = fs.readFileSync(path.resolve(__dirname, '../../test-custom-token.txt'), 'utf8');
  await page.goto('/');
  await page.addInitScript(({ config, token }) => {
    return new Promise((resolve) => {
      const script1 = document.createElement('script');
      script1.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js';
      script1.onload = () => {
        const script2 = document.createElement('script');
        script2.src = 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth-compat.js';
        script2.onload = () => {
          // @ts-ignore
          if (!window.firebase.apps.length) window.firebase.initializeApp(config);
          // @ts-ignore
          window.firebase.auth().signInWithCustomToken(token).then(resolve);
        };
        document.head.appendChild(script2);
      };
      document.head.appendChild(script1);
    });
  }, { config: firebaseConfig, token: customToken });
  await page.waitForTimeout(1500);
}
