import { fn } from 'jest-mock';

export const getFirestore = fn(() => ({}));
export const connectFirestoreEmulator = fn();
export const doc = fn();
export const getDoc = fn();
export const setDoc = fn();
export const updateDoc = fn();
export const collection = fn();
export const onSnapshot = fn();
export const where = fn();
export const query = fn();
export const orderBy = fn();
export const limit = fn();
export const getDocs = fn(() => ({ docs: [] }));
// Add any other Firestore functions your code uses below
