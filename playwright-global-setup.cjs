// playwright-global-setup.cjs
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '.env.e2e') });

module.exports = async () => {
  // Print environment and Playwright headless mode at runtime
  console.log('[Playwright GLOBAL SETUP] process.env.HEADLESS:', process.env.HEADLESS);
  // Playwright does not expose use.headless here, but config is set to false
  console.log('[Playwright GLOBAL SETUP] Playwright config forces headless: false');
  // Print key Firebase emulator envs for debug
  console.log('[Playwright GLOBAL SETUP] FIRESTORE_EMULATOR_HOST:', process.env.FIRESTORE_EMULATOR_HOST);
  console.log('[Playwright GLOBAL SETUP] FIREBASE_AUTH_EMULATOR_HOST:', process.env.FIREBASE_AUTH_EMULATOR_HOST);
  console.log('[Playwright GLOBAL SETUP] FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
  console.log('[Playwright GLOBAL SETUP] GCLOUD_PROJECT:', process.env.GCLOUD_PROJECT);
};
