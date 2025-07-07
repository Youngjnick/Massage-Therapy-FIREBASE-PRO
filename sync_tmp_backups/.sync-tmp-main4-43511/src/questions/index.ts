import { db } from '../firebase/firebaseConfig';
import { collectionGroup, getDocs } from 'firebase/firestore';
import { Question } from '../types';

export const getQuestions = async (): Promise<Question[]> => {
  const snapshot = await getDocs(collectionGroup(db, 'questions'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
};