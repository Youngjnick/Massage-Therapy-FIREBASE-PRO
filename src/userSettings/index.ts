import { db } from '../firebase/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface UserSettings {
  showExplanations: boolean;
  darkMode?: boolean;
  ariaSound?: boolean;
  haptic?: boolean;
}

export const getUserSettings = async (userId: string): Promise<UserSettings> => {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as UserSettings;
  }
  // Default settings
  return {
    showExplanations: true,
    darkMode: false,
    ariaSound: true,
    haptic: false,
  };
};

export const setUserSettings = async (userId: string, settings: Partial<UserSettings>) => {
  const ref = doc(db, 'users', userId);
  await setDoc(ref, settings, { merge: true });
};
