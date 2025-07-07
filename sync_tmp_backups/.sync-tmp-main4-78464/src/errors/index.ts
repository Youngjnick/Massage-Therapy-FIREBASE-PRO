import { db } from '../firebase/firebaseConfig';
import {
  collection, addDoc
} from 'firebase/firestore';

export const logError = async (error: string, userId: string) => {
    try {
        await addDoc(collection(db, 'errors'), {
            error,
            userId,
            timestamp: new Date(),
        });
    } catch (err) {
        console.error('Error logging error:', err);
    }
};

export const logFeedback = async (feedback: string, userId: string) => {
    try {
        await addDoc(collection(db, 'feedback'), {
            feedback,
            userId,
            timestamp: new Date(),
        });
    } catch (err) {
        console.error('Error logging feedback:', err);
    }
};