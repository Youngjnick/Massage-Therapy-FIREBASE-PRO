import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { auth } from "../firebase/indexFirebase.js";
import { firestoreDb } from "../firebase/indexFirebase.js";
import { doc, setDoc, getDoc } from "firebase/firestore";

const BookmarkContext = createContext();

export function BookmarkProvider({ children }) {
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const stored = localStorage.getItem("bookmarks");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(() => localStorage.getItem("bookmarkLastSync") || null);
  const [showLastSync, setShowLastSync] = useState(false); // NEW
  const user = auth.currentUser;
  const pendingSync = useRef(false);

  // Optimistic UI: update local state immediately, sync in background
  const addBookmark = (questionId) => {
    setBookmarks((prev) => (prev.includes(questionId) ? prev : [...prev, questionId]));
    pendingSync.current = true;
  };
  const removeBookmark = (questionId) => {
    setBookmarks((prev) => prev.filter((id) => id !== questionId));
    pendingSync.current = true;
  };
  const removeBookmarkById = (questionId) => {
    setBookmarks((prev) => prev.filter((id) => id !== questionId));
  };
  const isBookmarked = (questionId) => bookmarks.includes(questionId);

  // Sync bookmarks to Firestore when user or bookmarks change
  useEffect(() => {
    const user = auth.currentUser;
    if (user && user.uid) {
      const ref = doc(firestoreDb, "users", user.uid, "profile", "main");
      setDoc(ref, { bookmarks }, { merge: true })
        .then(() => console.log('[Firestore] Synced bookmarks to Firestore:', bookmarks))
        .catch((err) => console.error('[Firestore] Error syncing bookmarks:', err));
    }
  }, [bookmarks]);

  // Load bookmarks from Firestore on login
  useEffect(() => {
    if (user && user.uid) {
      setSyncing(true);
      setError(null);
      // Inline Firestore load logic
      const ref = doc(firestoreDb, "users", user.uid, "profile", "main");
      getDoc(ref)
        .then(snap => {
          const data = snap.exists() ? snap.data() : {};
          const remote = Array.isArray(data.bookmarks) ? data.bookmarks : [];
          if (remote.length) {
            setBookmarks(remote);
            localStorage.setItem("bookmarks", JSON.stringify(remote));
          }
          const now = new Date().toISOString();
          setLastSync(now);
          localStorage.setItem("bookmarkLastSync", now);
          setShowLastSync(true); // Show notification
          setTimeout(() => setShowLastSync(false), 3000); // Hide after 3s
        })
        .catch(e => setError(e?.message || String(e)))
        .finally(() => setSyncing(false));
    }
  }, [user && user.uid]);

  useEffect(() => {
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Manual sync retry
  const retrySync = () => {
    if (user && user.uid) {
      setSyncing(true);
      setError(null);
      const ref = doc(firestoreDb, "users", user.uid, "profile", "main");
      setDoc(ref, { bookmarks }, { merge: true })
        .then(() => {
          const now = new Date().toISOString();
          setLastSync(now);
          localStorage.setItem("bookmarkLastSync", now);
          setShowLastSync(true); // Show notification
          setTimeout(() => setShowLastSync(false), 3000); // Hide after 3s
        })
        .catch(e => setError(e?.message || String(e)))
        .finally(() => setSyncing(false));
    }
  };

  return (
    <BookmarkContext.Provider value={{ bookmarks, addBookmark, removeBookmark, removeBookmarkById, isBookmarked, syncing, error, lastSync, retrySync }}>
      {children}
      {syncing && (
        <div className="bookmark-sync-status" role="status" aria-live="polite" style={{position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', background: '#fffbe6', color: '#333', border: '1px solid #ffe58f', borderRadius: 6, padding: '0.5em 1em', zIndex: 1000, minWidth: 220, textAlign: 'center'}}>
          Syncing bookmarks...
        </div>
      )}
      {error && (
        <div className="bookmark-sync-error" role="alert" aria-live="assertive" style={{position: 'fixed', top: 56, left: '50%', transform: 'translateX(-50%)', background: '#fff1f0', color: '#cf1322', border: '1px solid #ffa39e', borderRadius: 6, padding: '0.5em 1em', zIndex: 1000, minWidth: 220, textAlign: 'center'}}>
          Bookmark sync error: {String(error)}
          <button style={{marginLeft: 12}} onClick={retrySync}>Retry</button>
        </div>
      )}
      {/* Show last sync as a notification for 3 seconds after sync */}
      {showLastSync && lastSync && !syncing && !error && (
        <div className="bookmark-last-sync" style={{position: 'fixed', top: 96, left: '50%', transform: 'translateX(-50%)', background: '#f6ffed', color: '#389e0d', border: '1px solid #b7eb8f', borderRadius: 6, padding: '0.25em 1em', zIndex: 1000, minWidth: 220, textAlign: 'center', fontSize: '0.95em', transition: 'opacity 0.5s'}}>
          Last synced: {new Date(lastSync).toLocaleString()}
        </div>
      )}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  return useContext(BookmarkContext);
}
