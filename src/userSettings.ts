import { db } from './firebase/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface UserSettings {
  darkMode: boolean;
  ariaSound: boolean;
  haptic: boolean;
  showExplanations: boolean;
}

export async function getUserSettings(uid: string): Promise<UserSettings | null> {
  const ref = doc(db, 'userSettings', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as UserSettings;
  }
  return null;
}

export async function setUserSettings(uid: string, settings: UserSettings): Promise<void> {
  const ref = doc(db, 'userSettings', uid);
  await setDoc(ref, settings, { merge: true });
}
