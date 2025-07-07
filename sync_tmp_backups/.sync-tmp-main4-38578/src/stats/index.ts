import { db } from '../firebase/firebaseConfig';
import {
  collection, addDoc, getDocs, query, where
} from 'firebase/firestore';

export const recordUserInteraction = async (userId: string, interactionData: any) => {
    try {
        await addDoc(collection(db, 'stats'), {
            userId,
            interactionData,
            timestamp: new Date(),
        });
    } catch (error) {
        console.error('Error recording user interaction:', error);
    }
};

export const getUserStats = async (userId: string) => {
    try {
        const q = query(collection(db, 'stats'), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        const stats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return stats;
    } catch (error) {
        console.error('Error retrieving user stats:', error);
        return [];
    }
};