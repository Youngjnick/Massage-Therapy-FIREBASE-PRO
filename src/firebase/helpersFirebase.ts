import { firestoreDb } from "./indexFirebase.js";
import { setDoc, getDoc, doc, collection, getDocs, collectionGroup } from "firebase/firestore";

// Custom error for unimplemented features
class NotImplementedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotImplementedError";
  }
}

// Suggestion type (expand as needed)
export interface Suggestion {
  [key: string]: unknown;
}

// Report type (expand as needed)
export interface Report {
  [key: string]: unknown;
}

// User profile type (expand as needed)
export interface UserProfile {
  [key: string]: unknown;
}

// Question type (expand as needed)
export interface Question {
  id: string;
  [key: string]: unknown;
}

// Submit a suggestion to Firebase
export async function submitSuggestionToFirebase(): Promise<void> {
  // TODO: Implement the logic to save the suggestion to Firebase
  throw new NotImplementedError("submitSuggestionToFirebase is not implemented.");
}

// Submit a report to Firebase
export async function submitReportToFirebase(): Promise<void> {
  // TODO: Implement the logic to save the report to Firebase
  throw new NotImplementedError("submitReportToFirebase is not implemented.");
}

// Save a user profile to Firebase
export async function saveUserProfile(): Promise<void> {
  // TODO: Implement the logic to save the user profile to Firebase
  throw new NotImplementedError("saveUserProfile is not implemented.");
}

// Load a user profile from Firebase
export async function loadUserProfile(): Promise<UserProfile | null> {
  // TODO: Implement the logic to load the user profile from Firebase
  throw new NotImplementedError("loadUserProfile is not implemented.");
}

// Save stats to Firebase
export async function saveStatsToFirebase(stats: Record<string, unknown>, uid: string): Promise<void> {
  if (!uid) { throw new Error("No user ID provided for saving stats"); }
  try {
    const statsDoc = doc(firestoreDb, "users", uid, "stats", "main");
    await setDoc(statsDoc, stats, { merge: true });
    console.log("Stats saved to Firebase for UID:", uid);
  } catch (error) {
    console.error("Error saving stats to Firebase:", error);
    throw error;
  }
}

// Load stats from Firebase
export async function loadStatsFromFirebase(uid: string): Promise<Record<string, unknown> | null> {
  if (!uid) { throw new Error("No user ID provided for loading stats"); }
  try {
    const statsDoc = doc(firestoreDb, "users", uid, "stats", "main");
    const docSnap = await getDoc(statsDoc);
    if (docSnap.exists()) {
      console.log("Stats loaded from Firebase for UID:", uid, docSnap.data());
      return docSnap.data();
    } else {
      console.log("No stats found in Firebase for UID:", uid);
      return null;
    }
  } catch (error) {
    console.error("Error loading stats from Firebase:", error);
    return null;
  }
}

export async function fetchQuestionsFromFirebase(): Promise<Question[]> {
  try {
    // Use collectionGroup to fetch all questions from any nested 'questions' subcollection
    const querySnapshot = await getDocs(collectionGroup(firestoreDb, "questions"));
    const questions: Question[] = [];
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
export async function fetchQuestions({ onLoading }: { onLoading?: (loading: boolean) => void } = {}): Promise<Question[]> {
  if (onLoading) { onLoading(true); }
  let questions: Question[] = [];
  try {
    questions = await fetchQuestionsFromFirebase();
  } catch (error) {
    console.error("Error fetching questions from Firebase:", error);
  } finally {
    if (onLoading) { onLoading(false); }
  }
  return questions;
}

// Sync progress to Firebase
export async function syncProgressToFirebase(user: { uid: string }, progress: unknown): Promise<void> {
  try {
    const userDoc = doc(firestoreDb, "users", user.uid);
    await setDoc(userDoc, { progress }, { merge: true });
    console.log("Progress synced successfully.");
  } catch (error) {
    console.error("Error syncing progress to Firebase:", error);
  }
}

// Load progress from Firebase
export async function loadProgressFromFirebase(user: { uid: string }): Promise<unknown> {
  try {
    const userDoc = doc(firestoreDb, "users", user.uid);
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

// Leaderboard user type
export interface LeaderboardUser {
  id: string;
  points?: number;
  [key: string]: unknown;
}

// Fetch leaderboard from Firestore (top N users by points)
export async function fetchLeaderboard(limit: number = 10): Promise<LeaderboardUser[]> {
  try {
    const leaderboardRef = collection(firestoreDb, "leaderboard");
    const querySnapshot = await getDocs(leaderboardRef);
    const users: LeaderboardUser[] = [];
    querySnapshot.forEach(doc => {
      const data = doc.data();
      users.push({ id: doc.id, points: typeof data.points === 'number' ? data.points : Number(data.points) || 0, ...data });
    });
    users.sort((a, b) => ((b.points || 0) - (a.points || 0)) * -1);
    return users.slice(0, limit);
  } catch (error) {
    console.error("Error fetching leaderboard from Firebase:", error);
    return [];
  }
}