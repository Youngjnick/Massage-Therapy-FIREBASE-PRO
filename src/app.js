// --- E2E TEST HOOK: Make setTestState available globally for Playwright E2E tests ---
// This must be set before any imports or app logic, so Playwright can access it immediately after page load.
// Defensive: ensure window.appState is always defined before E2E hook
window.appState = window.appState || {};
if (!Array.isArray(window.appState.badges)) window.appState.badges = [];
window.badges = window.appState.badges;
function syncBadgesToWindow() {
  if (window.appState && Array.isArray(window.appState.badges)) {
    window.badges = window.appState.badges;
  } else {
    if (!window.appState) window.appState = {};
    window.appState.badges = [];
    window.badges = window.appState.badges;
  }
}
window.setTestState = (state) => {
  if (!window.appState) window.appState = {};
  Object.assign(window.appState, state);
  if (!Array.isArray(window.appState.badges)) window.appState.badges = [];
  syncBadgesToWindow();
  if (typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new Event('testStateChanged'));
  }
};
window.__E2E_HOOK_ATTACHED = true;
syncBadgesToWindow();
window.addEventListener('testStateChanged', syncBadgesToWindow);
console.log('[E2E] window.setTestState attached on window');

// --- FIREBASE INITIALIZATION (modular v9+) ---
import { startQuiz, setupUI, getQuestions } from "./components/quiz.jsx";
import { appState } from "./appState.js";
import { app, firestoreDb, auth } from "./firebase/indexFirebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { fetchQuestions } from "./firebase/helpersFirebase.js";

// --- FETCH AND MERGE QUIZ RESULTS FROM FIRESTORE ---
import { getFirestore, doc, collection, getDocs } from "firebase/firestore";

// --- CHART.js MODULES ---
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  ArcElement,
  DoughnutController,
  Tooltip,
  Legend
} from "chart.js";

// Defensive Chart.js registration
try {
  Chart.register(
    BarController, BarElement, CategoryScale, LinearScale,
    LineController, LineElement, PointElement,
    ArcElement, DoughnutController, Tooltip, Legend
  );
  window.Chart = Chart;
} catch (e) {
  console.warn('Chart.js registration failed:', e);
}

// --- E2E TEST HOOK: Load questions from localStorage if present (for Playwright E2E reliability) ---
// Disabled: Always load questions from Firestore for E2E and manual testing
// if (window.__E2E_TEST__ && localStorage.getItem("questions")) {
//   try {
//     appState.questions = JSON.parse(localStorage.getItem("questions"));
//     console.log("[E2E] Loaded questions from localStorage for E2E test:", appState.questions.length);
//   } catch (e) {
//     appState.questions = [];
//     console.warn("[E2E] Failed to parse questions from localStorage:", e);
//   }
//   setupUI();
//   // --- E2E PATCH: Auto-start quiz if in E2E mode ---
//   setTimeout(() => {
//     if (window.__E2E_TEST__ && typeof window.startQuiz === "function") {
//       // Pick first topic and length if needed, then start quiz
//       try {
//         const topicSel = document.querySelector(".control[data-topic]");
//         const lenSel = document.querySelector(".control[data-quiz-length]");
//         if (topicSel && lenSel) {
//           topicSel.selectedIndex = 1;
//           lenSel.value = "10";
//         }
//         console.log("[E2E] window.startQuiz:", typeof window.startQuiz, "appState.questions:", Array.isArray(appState.questions) ? appState.questions.length : appState.questions);
//         if (typeof window.startQuiz === "function") {window.startQuiz();}
//         console.log("[E2E] Called window.startQuiz() in E2E mode");
//       } catch (e) { console.warn("[E2E] Auto-start quiz failed:", e); }
//     }
//   }, 100);
// }

// Listen for auth state changes and fetch questions after sign-in
onAuthStateChanged(auth, async user => {
  // Always fetch questions, regardless of auth state
  const questions = await fetchQuestions();
  appState.questions = questions;
  console.log("[DEBUG] Assigned questions to appState.questions, count:", appState.questions.length);
  if (Array.isArray(appState.questions)) {
    console.log("[DEBUG] First 3 questions:", appState.questions.slice(0, 3));
  }
  setupUI();
});

// --- FETCH AND MERGE QUIZ RESULTS FROM FIRESTORE ---
async function fetchAndMergeQuizResultsFromFirestore() {
  // Defensive: ensure db is a Firestore instance
  let db = (window.firebase && window.firebase.db) ? window.firebase.db : null;
  if (!db || typeof db !== "object" || db.type !== "firestore") {
    db = getFirestore();
    console.warn("[DEBUG] fetchAndMergeQuizResultsFromFirestore: window.firebase.db was not a Firestore instance, using getFirestore() instead.");
  }
  let userId = (window.firebase && window.firebase.auth && window.firebase.auth.currentUser && window.firebase.auth.currentUser.uid) || "anonymous";
  const results = [];
  try {
    const userDoc = doc(db, "users", userId);
    const quizResultsCol = collection(userDoc, "quizResults"); // v9+ modular syntax
    const snapshot = await getDocs(quizResultsCol);
    snapshot.forEach(docSnap => results.push(docSnap.data()));
    // Merge with localStorage
    let localResults = [];
    try {
      localResults = JSON.parse(localStorage.getItem("quizResults") || "[]");
    } catch (e) {}
    // Merge and deduplicate by date
    const allResults = [...localResults, ...results].reduce((acc, curr) => {
      if (!acc.find(r => r.date === curr.date)) {acc.push(curr);}
      return acc;
    }, []);
    localStorage.setItem("quizResults", JSON.stringify(allResults));
    // Optionally, update analytics immediately
    if (typeof window.renderHistoryChart === "function") {window.renderHistoryChart();}
    if (typeof window.renderAccuracyChart === "function") {
      // Optionally recalculate correct/incorrect/unanswered here
    }
  } catch (e) {
    console.warn("Could not fetch quiz results from Firestore:", e);
  }
}

// Call this on app load or after user login
document.addEventListener("DOMContentLoaded", fetchAndMergeQuizResultsFromFirestore);

function initializeAppLogic() {
  console.log("App logic initialized.");
}

document.addEventListener("DOMContentLoaded", () => {
  // DEPRECATED: All header links and controls are now handled by React. This logic is no longer used.
  // Legacy modal event listeners removed.

  // --- Activate question search bar ---
  // DEPRECATED: Question search bar is now handled by React. This logic is no longer used.
});

// --- Quiz card/question/answer area ---
// DEPRECATED: Quiz card is now handled by React. This logic is no longer used.
// Import and mount the new React badge panel and analytics modal entry point, so the React UI is available in the app for integration/testing.
import "./components/react-entry.jsx";

// Export Firestore instance and app logic initializer
export { appState, initializeAppLogic };

window.appState = appState;
window.setupUI = setupUI;
window.fetchQuestions = fetchQuestions;
window.getQuestions = getQuestions;
