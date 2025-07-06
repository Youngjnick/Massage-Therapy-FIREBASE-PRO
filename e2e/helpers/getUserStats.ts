/* eslint-env node */
/* global process */
/// <reference types="node" />
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export async function getUserStats(uid: string) {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error('FIRESTORE_EMULATOR_HOST is not set.');
  }
  if (!process.env.FIREBASE_PROJECT_ID && !process.env.GCLOUD_PROJECT) {
    throw new Error('FIREBASE_PROJECT_ID or GCLOUD_PROJECT is not set.');
  }
  if (!getApps().length) {
    initializeApp({
      credential: applicationDefault(),
    });
  }
  const db = getFirestore();
  const analyticsRef = db.doc(`users/${uid}/stats/analytics`);
  const path = `users/${uid}/stats/analytics`;
  try {
    console.log(`[getUserStats] Querying Firestore path: ${path}`);
    const doc = await analyticsRef.get();
    if (doc.exists) {
      console.log(`[getUserStats] Document found:`, doc.data());
      return doc.data();
    } else {
      console.log(`[getUserStats] Document does not exist at path: ${path}`);
      return null;
    }
  } catch (err) {
    console.error(`[getUserStats] Error fetching doc at path: ${path}`, err);
    throw err;
  }
}
