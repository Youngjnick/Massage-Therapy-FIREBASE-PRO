import { db } from '../firebase/firebaseConfig';
import {
  collection, addDoc, getDocs, query, where, deleteDoc, doc
} from 'firebase/firestore';

export const addBookmark = async (userId: string, bookmark: any) => {
  await addDoc(collection(db, 'bookmarks'), {
    userId,
    ...bookmark,
    createdAt: new Date(),
  });
};

export const getBookmarks = async (userId: string) => {
  const q = query(collection(db, 'bookmarks'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const deleteBookmark = async (bookmarkId: string) => {
  await deleteDoc(doc(db, 'bookmarks', bookmarkId));
};