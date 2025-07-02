/* eslint-env node */
/* global process */
// Ensure required environment variables for Firebase Admin emulator use
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error('FIRESTORE_EMULATOR_HOST is not set. Please set it to point to your Firestore emulator (e.g., localhost:8080).');
}
if (!process.env.GCLOUD_PROJECT && !process.env.FIREBASE_PROJECT_ID) {
  throw new Error('GCLOUD_PROJECT or FIREBASE_PROJECT_ID is not set. Please set your project ID for Firebase Admin emulator use.');
}

// Node.js helper to reset analytics.completed for a user in Firestore emulator

import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export async function resetUserStats(uid: string) {
  // Ensure Firebase Admin is initialized in this worker
  if (!getApps().length) {
    initializeApp({
      credential: applicationDefault(),
    });
  }
  const db = getFirestore();
  const analyticsRef = db.doc(`users/${uid}/stats/analytics`);
  await analyticsRef.set({ completed: 0 }, { merge: true });
}
