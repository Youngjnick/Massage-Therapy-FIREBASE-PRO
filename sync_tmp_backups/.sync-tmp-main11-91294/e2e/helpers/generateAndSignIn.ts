// @ts-nocheck
// e2e/helpers/generateAndSignIn.ts
import { execSync } from 'child_process';
import { signInWithCustomToken } from './auth';

export async function generateTokenAndSignIn(page, uid = 'test-user-uid') {
  // Generate a new custom token using the Node script
  execSync(`node scripts/generateCustomToken.cjs ${uid}`);
  // Use the shared sign-in helper
  await signInWithCustomToken(page);
}
