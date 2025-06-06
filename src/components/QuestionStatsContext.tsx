import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { auth } from "../firebase/indexFirebase.js";
import { firestoreDb } from "../firebase/indexFirebase.js";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

const QuestionStatsContext = createContext();

export function QuestionStatsProvider({ children }) {
  // Structure: { [questionId]: { correct, incorrect, attempts, missed, lastUpdated } }
  const [questionStats, setQuestionStats] = useState(() => {
    try {
      const stored = localStorage.getItem("questionStats");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [user, setUser] = useState(() => auth.currentUser);
  const ignoreRemote = useRef(false);

  // Real-time Firestore sync
  useEffect(() => {
    let unsub = () => {};
    const checkUser = setInterval(() => {
      if (auth.currentUser) {
        setUser(auth.currentUser);
        clearInterval(checkUser);
      }
    }, 200);
    if (user && user.uid) {
      const ref = doc(firestoreDb, "users", user.uid, "questionStats", "main");
      unsub = onSnapshot(ref, (snap) => {
        const data = snap.exists() ? snap.data() : null;
        console.log("[QuestionStatsContext] Firestore onSnapshot:", {
          user: user.uid,
          data,
        });
        if (data && data.stats) {
          // Merge logic: for each questionId, prefer the most recent lastUpdated
          const merged = { ...questionStats };
          for (const [qid, remoteStat] of Object.entries(data.stats)) {
            const localStat = merged[qid] || {};
            if ((remoteStat.lastUpdated || 0) > (localStat.lastUpdated || 0)) {
              merged[qid] = remoteStat;
            }
          }
          setQuestionStats(merged);
          localStorage.setItem("questionStats", JSON.stringify(merged));
          console.log(
            "[QuestionStatsContext] Updated local state from Firestore snapshot",
          );
        }
      });
    }
    return () => {
      unsub();
      clearInterval(checkUser);
    };
  }, [user && user.uid]);

  function updateQuestionStat(questionId, statUpdate) {
    setQuestionStats((prev) => {
      const now = Date.now();
      const prevStat = prev[questionId] || {
        correct: 0,
        incorrect: 0,
        attempts: 0,
        missed: 0,
        lastUpdated: 0,
      };
      const nextStat = { ...prevStat, ...statUpdate, lastUpdated: now };
      const next = { ...prev, [questionId]: nextStat };
      localStorage.setItem("questionStats", JSON.stringify(next));
      console.log(
        "[QuestionStatsContext] updateQuestionStat: localStorage updated",
        { questionId, nextStat },
      );
      if (user && user.uid) {
        ignoreRemote.current = true;
        console.log(
          "[QuestionStatsContext] updateQuestionStat Firestore setDoc",
          { user: user.uid, questionId, nextStat },
        );
        setDoc(
          doc(firestoreDb, "users", user.uid, "questionStats", "main"),
          { stats: next },
          { merge: true },
        )
          .catch((e) =>
            console.error(
              "[QuestionStatsContext] updateQuestionStat Firestore error:",
              e,
            ),
          )
          .finally(() => {
            setTimeout(() => {
              ignoreRemote.current = false;
            }, 500);
          });
      } else {
        console.warn(
          "[QuestionStatsContext] updateQuestionStat: No user set, skipping Firestore sync",
        );
      }
      return next;
    });
  }

  return (
    <QuestionStatsContext.Provider
      value={{ questionStats, updateQuestionStat }}
    >
      {children}
    </QuestionStatsContext.Provider>
  );
}

export function useQuestionStats() {
  return useContext(QuestionStatsContext);
}
