import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/indexFirebase.js";
import { doc, onSnapshot } from "firebase/firestore";
import { firestoreDb } from "../firebase/indexFirebase.js";
import usePersistentState from "../utils/usePersistentState";
import type { User } from "firebase/auth";
import { QuizHistoryItem, MasteryHistoryItem } from "../types/analytics";

// Define analytics types
interface Analytics {
  correct: number;
  total: number;
  streak: number;
  completed: number;
  lastUpdated: number;
}
interface AnalyticsContextType {
  analytics: Analytics;
  setAnalytics: React.Dispatch<React.SetStateAction<Analytics>>;
  quizHistory: QuizHistoryItem[];
  setQuizHistory: React.Dispatch<React.SetStateAction<QuizHistoryItem[]>>;
  masteryHistory: MasteryHistoryItem[];
  setMasteryHistory: React.Dispatch<React.SetStateAction<MasteryHistoryItem[]>>;
  errorMap: Record<string, unknown>;
  setErrorMap: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  updateAnalytics: (updates: Partial<Analytics> & {
    errorMap?: Record<string, unknown>;
    quizHistory?: QuizHistoryItem[];
    masteryHistory?: MasteryHistoryItem[];
  }) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  // Use usePersistentState for all analytics state
  const [analytics, setAnalytics] = usePersistentState<Analytics>("analytics", {
    correct: 0,
    total: 0,
    streak: 0,
    completed: 0,
    lastUpdated: 0,
  });
  const [quizHistory, setQuizHistory] = usePersistentState<QuizHistoryItem[]>("quizHistory", []);
  const [masteryHistory, setMasteryHistory] = usePersistentState<MasteryHistoryItem[]>(
    "masteryHistory",
    [],
  );
  const [errorMap, setErrorMap] = usePersistentState<Record<string, unknown>>("errorMap", {});
  const [user, setUser] = useState<User | null>(null);
  const ignoreRemote = useRef(false); // Prevent feedback loop

  // Listen for auth state changes and Firestore real-time updates
  useEffect(() => {
    let unsub = () => {};
    const authUnsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u && u.uid) {
        // Real-time Firestore sync
        const ref = doc(firestoreDb, "users", u.uid, "stats", "main");
        unsub = onSnapshot(ref, (snap) => {
          const data = snap.exists() ? snap.data() : null;
          console.log("[AnalyticsContext] Firestore onSnapshot:", {
            user: u.uid,
            data,
          });
          if (data && data.analytics) {
            // Merge logic: prefer most recent lastUpdated
            const localLast = analytics.lastUpdated || 0;
            const remoteLast = data.analytics.lastUpdated || 0;
            if (remoteLast > localLast && !ignoreRemote.current) {
              setAnalytics(data.analytics);
              setQuizHistory(data.quizHistory || []);
              setMasteryHistory(data.masteryHistory || []);
              setErrorMap(data.errorMap || {});
              console.log(
                "[AnalyticsContext] Updated local state from Firestore snapshot",
              );
            }
          }
        });
      }
    });
    return () => {
      unsub();
      authUnsub();
    };
  }, [
    analytics.lastUpdated,
    setAnalytics,
    setQuizHistory,
    setMasteryHistory,
    setErrorMap,
  ]);

  // Listen for E2E testStateChanged event to reload analytics state from localStorage/appState
  useEffect(() => {
    function handleTestStateChanged() {
      // Try to reload from window.appState, then localStorage
      let newAnalytics: Analytics = {
        correct: 0,
        total: 0,
        streak: 0,
        completed: 0,
        lastUpdated: 0,
      };
      let newQuizHistory: QuizHistoryItem[] = [];
      let newMasteryHistory: MasteryHistoryItem[] = [];
      let newErrorMap: Record<string, unknown> = {};
      if (typeof window !== "undefined" && window.appState) {
        const analyticsObj = window.appState.analytics as Partial<Analytics> | undefined;
        if (analyticsObj && typeof analyticsObj === "object") {
          newAnalytics = {
            correct: analyticsObj.correct ?? 0,
            total: analyticsObj.total ?? 0,
            streak: analyticsObj.streak ?? 0,
            completed: analyticsObj.completed ?? 0,
            lastUpdated: Date.now(),
          };
        }
        if (Array.isArray(window.appState.quizHistory))
          newQuizHistory = window.appState.quizHistory;
        if (Array.isArray(window.appState.masteryHistory))
          newMasteryHistory = window.appState.masteryHistory;
        if (window.appState.errorMap && typeof window.appState.errorMap === "object")
          newErrorMap = window.appState.errorMap as Record<string, unknown>;
      } else if (typeof window !== "undefined" && window.localStorage) {
        try {
          const localAnalytics = JSON.parse(
            window.localStorage.getItem("analytics") || "{}",
          ) as Partial<Analytics>;
          if (localAnalytics && typeof localAnalytics === "object")
            newAnalytics = {
              correct: localAnalytics.correct ?? 0,
              total: localAnalytics.total ?? 0,
              streak: localAnalytics.streak ?? 0,
              completed: localAnalytics.completed ?? 0,
              lastUpdated: Date.now(),
            };
        } catch {}
        try {
          const localQuizHistory = JSON.parse(
            window.localStorage.getItem("quizHistory") || "[]",
          );
          if (Array.isArray(localQuizHistory))
            newQuizHistory = localQuizHistory;
        } catch {}
        try {
          const localMasteryHistory = JSON.parse(
            window.localStorage.getItem("masteryHistory") || "[]",
          );
          if (Array.isArray(localMasteryHistory))
            newMasteryHistory = localMasteryHistory;
        } catch {}
        try {
          const localErrorMap = JSON.parse(
            window.localStorage.getItem("errorMap") || "{}",
          );
          if (localErrorMap && typeof localErrorMap === "object")
            newErrorMap = localErrorMap;
        } catch {}
      }
      setAnalytics(newAnalytics);
      setQuizHistory(newQuizHistory);
      setMasteryHistory(newMasteryHistory);
      setErrorMap(newErrorMap ?? {});
    }
    window.addEventListener("testStateChanged", handleTestStateChanged);
    return () =>
      window.removeEventListener("testStateChanged", handleTestStateChanged);
  }, []);

  useEffect(() => {
    console.log("[AnalyticsContext] analytics changed:", analytics);
  }, [analytics]);
  useEffect(() => {
    console.log("[AnalyticsContext] quizHistory changed:", quizHistory);
  }, [quizHistory]);
  useEffect(() => {
    console.log("[AnalyticsContext] masteryHistory changed:", masteryHistory);
  }, [masteryHistory]);
  useEffect(() => {
    console.log("[AnalyticsContext] errorMap changed:", errorMap);
  }, [errorMap]);

  function updateAnalytics(updates: Partial<Analytics> & {
    errorMap?: Record<string, unknown>;
    quizHistory?: QuizHistoryItem[];
    masteryHistory?: MasteryHistoryItem[];
  }) {
    if (updates.quizHistory) setQuizHistory(updates.quizHistory);
    if (updates.masteryHistory) setMasteryHistory(updates.masteryHistory);
    if (updates.errorMap) setErrorMap(updates.errorMap);
    setAnalytics((prev: Analytics) => ({
      correct: updates.correct !== undefined ? updates.correct : prev.correct,
      total: updates.total !== undefined ? updates.total : prev.total,
      streak: updates.streak !== undefined ? updates.streak : prev.streak,
      completed: updates.completed !== undefined ? updates.completed : prev.completed,
      lastUpdated: Date.now(),
    }));
  }

  return (
    <AnalyticsContext.Provider value={{ analytics, setAnalytics, quizHistory, setQuizHistory, masteryHistory, setMasteryHistory, errorMap, setErrorMap, user, setUser, updateAnalytics }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics(): AnalyticsContextType {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error("useAnalytics must be used within AnalyticsProvider");
  return ctx;
}

// When updating newAnalytics, always provide all required fields
// When updating newErrorMap, default to {} if null
export type { AnalyticsContextType, Analytics };
