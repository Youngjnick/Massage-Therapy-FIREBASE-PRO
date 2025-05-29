import React, { createContext, useContext, useState } from "react";

const AnalyticsContext = createContext();

export function AnalyticsProvider({ children }) {
  // Load from localStorage if available
  const [analytics, setAnalytics] = useState(() => {
    try {
      const stored = localStorage.getItem("analytics");
      return stored ? JSON.parse(stored) : { correct: 0, total: 0, streak: 0, completed: 0 };
    } catch {
      return { correct: 0, total: 0, streak: 0, completed: 0 };
    }
  });
  const [quizHistory, setQuizHistory] = useState(() => {
    try {
      const stored = localStorage.getItem("quizHistory");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [masteryHistory, setMasteryHistory] = useState(() => {
    try {
      const stored = localStorage.getItem("masteryHistory");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [errorMap, setErrorMap] = useState(() => {
    try {
      const stored = localStorage.getItem("errorMap");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  function updateAnalytics(updates) {
    setAnalytics((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem("analytics", JSON.stringify(next));
      return next;
    });
    if (updates.quizHistory) {
      setQuizHistory(updates.quizHistory);
      localStorage.setItem("quizHistory", JSON.stringify(updates.quizHistory));
    }
    if (updates.masteryHistory) {
      setMasteryHistory(updates.masteryHistory);
      localStorage.setItem("masteryHistory", JSON.stringify(updates.masteryHistory));
    }
    if (updates.errorMap) {
      setErrorMap(updates.errorMap);
      localStorage.setItem("errorMap", JSON.stringify(updates.errorMap));
    }
  }

  return (
    <AnalyticsContext.Provider
      value={{
        analytics,
        updateAnalytics,
        quizHistory,
        masteryHistory,
        errorMap,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  return useContext(AnalyticsContext);
}