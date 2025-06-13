import { db } from '../firebase/firebaseConfig';
import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore';

export interface Bookmark {
  id?: string;
  userId: string;
  questionId: string;
  createdAt?: number;
}

export async function getBookmarks(userId: string): Promise<Bookmark[]> {
  const q = query(collection(db, 'bookmarks'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bookmark));
}

export async function addBookmark(userId: string, questionId: string): Promise<void> {
  const ref = doc(collection(db, 'bookmarks'));
  await setDoc(ref, {
    userId,
    questionId,
    createdAt: Date.now(),
  });
}

export async function removeBookmark(bookmarkId: string): Promise<void> {
  const ref = doc(db, 'bookmarks', bookmarkId);
  await deleteDoc(ref);
}

export async function deleteBookmark(bookmarkId: string): Promise<void> {
  return removeBookmark(bookmarkId);
}
