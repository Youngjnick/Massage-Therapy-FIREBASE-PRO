// scripts/resetAuthEmulator.ts
// Resets all users in the Firebase Auth emulator
import fetch from 'node-fetch';

const host = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
const projectId = process.env.FIREBASE_PROJECT_ID || 'demo-project';

async function resetAuth() {
  const url = `http://${host}/emulator/v1/projects/${projectId}/accounts`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(`Failed to reset Auth emulator: ${res.status} ${res.statusText}`);
  }
  console.log('Auth emulator reset.');
}

resetAuth().catch(e => {
  console.error(e);
  process.exit(1);
});
