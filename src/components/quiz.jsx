import { shuffle, prettifyName, formatTopicName } from "../utils/index.js";
import { SELECTORS, appState } from "../appState.js";
import { checkBadges } from "./badges.jsx";
import { saveUserData, saveStats, saveQuizResult, updateQuestionMeta, saveCompressedToLocalStorage, loadCompressedFromLocalStorage } from "../utils/storage.js";
import { getFirestore, getDocs, collectionGroup } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// --- REMOVE ALL LEGACY BOOKMARK/FIRESTORE SYNC LOGIC BELOW THIS POINT ---
// All bookmark sync, toast, and sidebar logic is now handled by React context/provider.
// The following functions are deprecated and should not be used:
// - showBookmarkSyncToast
// - updateBookmarkSyncStatusIcon
// - renderBookmarkedIndex
// - saveBookmarksToFirestore
// - syncBookmarksFromFirestore
// - setBookmarks
// - getBookmarks
// - validateBookmarks

// --- 6. UI & QUIZ LOGIC ---
// All UI logic is now handled by React components. Legacy DOM logic removed.

function setupUI() {
  // Defensive: ensure quiz pool arrays are always arrays
  appState.unansweredQuestions = Array.isArray(appState.unansweredQuestions) ? appState.unansweredQuestions : [];
  appState.missedQuestions = Array.isArray(appState.missedQuestions) ? appState.missedQuestions : [];
  appState.bookmarkedQuestions = Array.isArray(appState.bookmarkedQuestions) ? appState.bookmarkedQuestions : [];
  // All further UI setup is handled by React. This function is now a no-op.
}

// Remove all legacy DOM-based quiz logic below this point.

// --- Stub for offline download (for test compatibility) ---
function downloadQuestionsForOffline() {
  // This is a stub to satisfy the export requirement
  return Promise.resolve();
}

// --- Always use Firestore for getQuestions ---
async function getQuestions() {
  const db = getFirestore();
  try {
    const snapshot = await getDocs(collectionGroup(db, "questions"));
    const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("[DEBUG] getQuestions fetched", questions.length, "questions:", questions.slice(0, 3));
    return questions;
  } catch (err) {
    console.error("[DEBUG] getQuestions Firestore error:", err);
    return [];
  }
}

// --- Quiz logic entry point for legacy and E2E compatibility ---
function startQuiz() {
  // This is a stub for legacy/E2E compatibility. Actual quiz start logic is now handled by React.
  console.log('[DEBUG] startQuiz called (stub)');
}

export { setupUI, getQuestions, downloadQuestionsForOffline, startQuiz };