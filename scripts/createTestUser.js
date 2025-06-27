// scripts/createTestUser.js
// Run with: node scripts/createTestUser.js

// Force the correct emulator host (use 127.0.0.1, not localhost)
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
console.log('FIREBASE_AUTH_EMULATOR_HOST:', process.env.FIREBASE_AUTH_EMULATOR_HOST);
const admin = require('firebase-admin');

// Use the emulator if running locally
admin.initializeApp({
  projectId: 'massage-therapy-smart-st-c7f8f',
});

const auth = admin.auth();

const TEST_EMAIL = 'test1234@gmail.com';
const TEST_PASSWORD = 'test1234';
const TEST_DISPLAY_NAME = 'Test User';

async function ensureTestUser() {
  try {
    // Try to get the user
    let user;
    try {
      user = await auth.getUserByEmail(TEST_EMAIL);
      console.log('Test user already exists:', user.uid);
    } catch {
      // If not found, create
      user = await auth.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        displayName: TEST_DISPLAY_NAME,
      });
      console.log('Created test user:', user.uid);
    }
    // Optionally update displayName if needed
    if (user.displayName !== TEST_DISPLAY_NAME) {
      await auth.updateUser(user.uid, { displayName: TEST_DISPLAY_NAME });
      console.log('Updated test user displayName.');
    }
  } catch (err) {
    console.error('Failed to ensure test user:', err);
    process.exit(1);
  }
  process.exit(0);
}

ensureTestUser();
