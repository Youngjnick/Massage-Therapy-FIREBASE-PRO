import { db } from '../firebase/firebaseConfig';
import {
  collection, getDocs, doc, updateDoc, addDoc
} from 'firebase/firestore';

export interface Badge {
  id: string;
  name: string;
  description: string;
  criteria: string;
  awarded: boolean;
}

export const getBadges = async (): Promise<Badge[]> => {
  const snapshot = await getDocs(collection(db, 'badges'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Badge));
};

export const awardBadge = async (userId: string, badgeId: string): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    badges: badgeId // For arrayUnion, use FieldValue from server if needed
  });
};

export const createBadge = async (badge: Badge): Promise<void> => {
  await addDoc(collection(db, 'badges'), badge);
};