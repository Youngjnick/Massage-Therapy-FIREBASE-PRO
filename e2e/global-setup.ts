// Playwright global setup: Reset Auth emulator and create test user before all tests
import fetch from 'node-fetch';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.e2e' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function globalSetup() {
  // Set the correct projectId for your emulator and app
  const projectId = 'massage-therapy-smart-st-c7f8f';
  // Reset the Firebase Auth emulator
  try {
    execSync(`curl -X DELETE http://localhost:9099/emulator/v1/projects/${projectId}/accounts`, { stdio: 'ignore' });
  } catch (e) {
    // Ignore errors if emulator is already clean
  }

  // Generate unique emails for each test user per run
  function randomEmail(prefix: string) {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}@gmail.com`;
  }
  const testUsers = [
    { email: randomEmail('testuserc'), password: 'testuserC' },
    { email: randomEmail('testuserd'), password: 'testuserD' },
    // Add more users here if needed
  ];
  let debugSummary = [];
  // Store created user info for test consumption
  const createdUsers: { email: string; password: string; uid: string }[] = [];
  for (const user of testUsers) {
    try {
      // Create user in Auth emulator
      const res = await fetch(`http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key&projectId=${projectId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            password: user.password,
            returnSecureToken: true
          })
        });
      const data = await res.json();
      let idToken, localId;
      if (!res.ok || data.error) {
        debugSummary.push(`SignUp error for ${user.email}: ${JSON.stringify(data)}`);
        // Try to sign in to check if user exists with correct password
        const signInRes = await fetch(`http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key&projectId=${projectId}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              password: user.password,
              returnSecureToken: true
            })
          });
        const signInData = await signInRes.json();
        if (!signInRes.ok || signInData.error) {
          debugSummary.push(`SignIn error for ${user.email}: ${JSON.stringify(signInData)}`);
          throw new Error(`Failed to create or sign in test user: ${user.email}`);
        } else {
          debugSummary.push(`User ${user.email} already exists and signed in successfully. UID: ${signInData.localId}`);
          idToken = signInData.idToken;
          localId = signInData.localId;
        }
      } else {
        debugSummary.push(`User ${user.email} created successfully. UID: ${data.localId}`);
        idToken = data.idToken;
        localId = data.localId;
      }
      if (localId) {
        createdUsers.push({ email: user.email, password: user.password, uid: localId });
      }
      // Create Firestore user doc for this user
      if (localId) {
        const firestoreRes = await fetch(`http://localhost:8080/v1/projects/${projectId}/databases/(default)/documents/users?documentId=${localId}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fields: {
                email: { stringValue: user.email },
                createdByTest: { booleanValue: true }
              }
            })
          });
        const firestoreData = await firestoreRes.json();
        if (!firestoreRes.ok || firestoreData.error) {
          debugSummary.push(`Firestore doc error for ${user.email}: ${JSON.stringify(firestoreData)}`);
        } else {
          debugSummary.push(`Firestore user doc created for ${user.email} (uid: ${localId})`);
        }
      } else {
        debugSummary.push(`No localId for ${user.email}, skipping Firestore doc creation.`);
      }
    } catch (err) {
      // TypeScript-safe error message extraction
      let errMsg = '';
      if (err && typeof err === 'object' && 'stack' in err && typeof (err as any).stack === 'string') {
        errMsg = (err as any).stack;
      } else if (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') {
        errMsg = (err as any).message;
      } else {
        errMsg = String(err);
      }
      debugSummary.push(`Exception while creating/signing in user ${user.email}: ${errMsg}`);
      throw err;
    }
  }
  // Save created user info to a file for tests to consume
  writeFileSync(__dirname + '/test-users.json', JSON.stringify(createdUsers, null, 2));
  // Print debug summary to stdout so Copilot can read it
  console.log('PLAYWRIGHT_USER_CREATION_DEBUG_START');
  for (const line of debugSummary) {
    console.log(line);
  }
  console.log('PLAYWRIGHT_USER_CREATION_DEBUG_END');
  console.log('PLAYWRIGHT_TEST_USERS_JSON_START');
  console.log(JSON.stringify(createdUsers, null, 2));
  console.log('PLAYWRIGHT_TEST_USERS_JSON_END');
}

export default globalSetup;
