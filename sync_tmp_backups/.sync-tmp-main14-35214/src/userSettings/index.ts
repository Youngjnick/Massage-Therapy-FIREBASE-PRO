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
    const data = snap.data() as UserSettings;
    if (typeof window !== 'undefined') {
      console.log('[DEBUG][userSettings] getUserSettings:', userId, data);
    }
    return data;
  }
  // Default settings
  const defaults = {
    showExplanations: true,
    darkMode: false,
    ariaSound: true,
    haptic: false,
  };
  if (typeof window !== 'undefined') {
    console.log('[DEBUG][userSettings] getUserSettings: no data, returning defaults for', userId, defaults);
  }
  return defaults;
};

export const setUserSettings = async (userId: string, settings: Partial<UserSettings>) => {
  const ref = doc(db, 'users', userId);
  if (typeof window !== 'undefined') {
    console.log('[DEBUG][userSettings] setUserSettings:', userId, settings);
  }
  await setDoc(ref, settings, { merge: true });
};
