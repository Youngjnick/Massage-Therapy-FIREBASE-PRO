import { firestoreDb, auth } from "./indexFirebase.js";
import { setDoc, getDoc, doc, collection, addDoc, getDocs, collectionGroup } from "firebase/firestore";
import { saveQuestionsToLocalStorage, fetchQuestionsFromLocalStorage } from "../utils/storage.js";

// Submit a suggestion to Firebase
export async function submitSuggestionToFirebase(suggestion) {
  console.log("Suggestion submitted:", suggestion);
  // TODO: Implement the logic to save the suggestion to Firebase
}

// Submit a report to Firebase
export async function submitReportToFirebase(report) {
  console.log("Report submitted:", report);
  // TODO: Implement the logic to save the report to Firebase
}

// Save a user profile to Firebase
export async function saveUserProfile(uid, data) {
  console.log(`User profile saved for UID: ${uid}`, data);
  // TODO: Implement the logic to save the user profile to Firebase
}

// Load a user profile from Firebase
export async function loadUserProfile(uid) {
  // TODO: Implement the logic to load the user profile from Firebase
}

// Save stats to Firebase
export async function saveStatsToFirebase(stats, uid) {
  // TODO: Implement the logic to save stats to Firebase
}

// Load stats from Firebase
export async function loadStatsFromFirebase(uid) {
  // TODO: Implement the logic to load stats from Firebase
}

export async function fetchQuestionsFromFirebase() {
  try {
    // Use collectionGroup to fetch all questions from any nested 'questions' subcollection
    const querySnapshot = await getDocs(collectionGroup(firestoreDb, "questions"));
    const questions = [];
    querySnapshot.forEach(doc => {
      questions.push({ id: doc.id, ...doc.data() });
    });
    console.log("DEBUG: fetched questions from Firebase", questions);
    return questions;
  } catch (error) {
    console.error("Error fetching questions from Firebase:", error);
    throw error;
  }
}

// Unified fetch logic for questions
// REACT MIGRATION: Remove direct DOM access for loading indicator. Use callback or state in React instead.
export async function fetchQuestions({ onLoading } = {}) {
  if (onLoading) onLoading(true);
  let questions = [];
  try {
    questions = await fetchQuestionsFromFirebase();
    saveQuestionsToLocalStorage(questions);
  } catch (error) {
    console.warn("Falling back to local storage due to Firebase error:", error);
    questions = fetchQuestionsFromLocalStorage();
  } finally {
    if (onLoading) onLoading(false);
  }
  return questions;
}

// Sync progress to Firebase
export async function syncProgressToFirebase(user, progress) {
  try {
    const userDoc = doc(db, "users", user.uid);
    await setDoc(userDoc, { progress }, { merge: true });
    console.log("Progress synced successfully.");
  } catch (error) {
    console.error("Error syncing progress to Firebase:", error);
  }
}

// Load progress from Firebase
export async function loadProgressFromFirebase(user) {
  try {
    const userDoc = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDoc);
    if (docSnap.exists()) {
      console.log("Progress loaded successfully:", docSnap.data());
      return docSnap.data().progress;
    } else {
      console.log("No progress found for user.");
      return null;
    }
  } catch (error) {
    console.error("Error loading progress from Firebase:", error);
    return null;
  }
}