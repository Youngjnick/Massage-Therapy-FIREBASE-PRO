import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// Save bookmarks to Firestore for a user
export async function saveBookmarksToFirestore(userId, bookmarks) {
  try {
    const db = getFirestore();
    const ref = doc(db, "users", userId);
    await setDoc(ref, { bookmarks, lastSync: new Date().toISOString() }, { merge: true });
    return true;
  } catch (e) {
    console.error("[Bookmark Sync] Failed to save bookmarks:", e);
    return false;
  }
}

// Load bookmarks from Firestore for a user
export async function loadBookmarksFromFirestore(userId) {
  try {
    const db = getFirestore();
    const ref = doc(db, "users", userId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      if (!Array.isArray(data.bookmarks)) {
        console.warn("[Bookmark Sync] Bookmarks in Firestore are not an array:", data.bookmarks);
        return [];
      }
      return data.bookmarks;
    }
    return [];
  } catch (e) {
    console.error("[Bookmark Sync] Failed to load bookmarks:", e);
    return [];
  }
}
