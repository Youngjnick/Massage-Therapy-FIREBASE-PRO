import React, { useState, useEffect, useCallback } from "react";
import AnalyticsModal from "./AnalyticsModal.jsx";
import SmartLearningModal from "./SmartLearningModal.jsx";
import ProfileModal from "./ProfileModal.jsx";
import SettingsModal from "./SettingsModal.jsx";
import { useNotification } from "./NotificationProvider.jsx";
import QuestionSearch from "./QuestionSearch.jsx";
import { getSmartRecommendation } from "../utils/index.js";
import { auth } from "../firebase/indexFirebase.js";
import { signInWithGoogle, signOutUser } from "./auth.jsx";
import { downloadQuestionsForOffline } from "./quiz.jsx";
import HeaderControls from "./HeaderControls.jsx";
import HeaderActions from "./HeaderActions.jsx";
import BadgeProgressPanel from "./BadgeProgressPanel";
import QuizCard from "./QuizCard";
import DebugPanel from "./DebugPanel.jsx";
import BookmarkedSidebar from "./BookmarkedSidebar.jsx";
import { Badge } from "../utils/badgeHelpers";
import { useAnalytics } from "./AnalyticsContext";
import { useBadges } from "./BadgeContext";
import usePersistentState from "../utils/usePersistentState";
import ProfileAvatar from "./ProfileAvatar";
import BadgeDetailsModal from "./BadgeDetailsModal";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { firestoreDb } from "../firebase/indexFirebase";
import type { Question } from "../utils";
import type { AppState } from "../appState";
import type { QuizHistoryItem, MasteryHistoryItem } from "../types/analytics";
import type { User } from "firebase/auth";

// Remove local AnalyticsCtxType and use AnalyticsContextType from AnalyticsContext
import type { AnalyticsContextType } from "./AnalyticsContext";

// Helper to safely get env vars in Vite or Jest
function getEnv(key: string, fallback: unknown) {
  try {
    if (
      typeof process !== "undefined" &&
      process.env &&
      process.env.JEST_WORKER_ID
    )
      return undefined;
    if (
      typeof import.meta !== "undefined" &&
      import.meta.env &&
      key in import.meta.env
    ) {
      return import.meta.env[key];
    }
  } catch {}
  if (typeof process !== "undefined" && process.env && key in process.env) {
    return process.env[key];
  }
  return fallback;
}

interface QuizCardWrapperProps {
  questions: Question[];
  selectedTopic?: string;
  quizLength?: string | number;
  onToggleBookmarks?: () => void;
  onRestartQuiz?: () => void;
  onStatsUpdate?: () => void;
  onQuestionAnswered?: (qid: string, answeredIdx: number) => void;
}

function QuizCardWrapper(props: QuizCardWrapperProps) {
  const { updateAnalytics } = useAnalytics() as AnalyticsContextType;
  React.useEffect(() => {
    const now = Date.now();
    const questions = props.questions || [];
    let correct = 0,
      bestStreak = 0;
    let quizResults: QuizHistoryItem[] = [];
    let masteryArr: MasteryHistoryItem[] = [];
    let errorMapObj: { [id: string]: { [timestamp: string]: number } } = {};
    if (questions.length > 0) {
      correct = questions.filter(
        (q) => q.answered && q.answered === q.correct,
      ).length;
      bestStreak = 0;
      let currStreak = 0;
      questions.forEach((q) => {
        if (q.answered === q.correct) {
          currStreak++;
          bestStreak = Math.max(bestStreak, currStreak);
        } else {
          currStreak = 0;
        }
      });
      quizResults = [
        {
          score: correct,
          total: questions.length,
          date: now,
          streak: bestStreak,
          correct,
          incorrect: questions.length - correct,
        },
      ];
      let topicMap: { [topic: string]: { correct: number; total: number } } = {};
      questions.forEach((q) => {
        if (!q.topic) return;
        if (!topicMap[q.topic]) topicMap[q.topic] = { correct: 0, total: 0 };
        if (q.answered === q.correct) topicMap[q.topic].correct++;
        topicMap[q.topic].total++;
      });
      const avgMastery = Object.values(topicMap).length
        ? Math.round(
            (Object.values(topicMap).reduce(
              (a: number, t: { correct: number; total: number }) => a + t.correct / (t.total || 1),
              0,
            ) /
              Object.values(topicMap).length) *
              100,
          )
        : 0;
      masteryArr = [{ date: now, avgMastery }];
      errorMapObj = {};
      questions.forEach((q) => {
        if (q.answered !== undefined && q.answered !== q.correct) {
          if (!errorMapObj[q.id]) errorMapObj[q.id] = {};
          errorMapObj[q.id][now] = (errorMapObj[q.id][now] || 0) + 1;
        }
      });
    }
    const hasAnswered =
      Array.isArray(questions) &&
      questions.some((q) => q.answered !== undefined);
    if (questions.length > 0 && hasAnswered) {
      updateAnalytics({
        correct,
        streak: bestStreak,
        total: questions.length,
        completed: 0,
        quizHistory: quizResults,
        masteryHistory: masteryArr,
        errorMap: errorMapObj,
      });
    } else {
      console.log(
        "[AppWithReactPanels] Skipping updateAnalytics: no answered questions or empty quiz.",
      );
    }
  }, [props.questions, props.selectedTopic, props.quizLength]);
  return <QuizCard {...props} onQuestionAnswered={props.onQuestionAnswered} />;
}

interface AppPanelsProps {
  appState: AppState;
}

function AppPanels({ appState }: AppPanelsProps) {
  const analyticsCtx = useAnalytics() as AnalyticsContextType;
  const badgesCtx = useBadges();
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [smartLearningOpen, setSmartLearningOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [analyticsData, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [badgesData, setBadges] = useState<Badge[] | undefined>(undefined);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => document.body.classList.contains("dark-mode"));
  const [soundEnabled, setSoundEnabled] = usePersistentState<boolean>("soundEnabled", false);
  const handleToggleSound = () => setSoundEnabled(!soundEnabled);
  const [signedIn, setSignedIn] = useState(!!auth.currentUser);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedLength, setSelectedLength] = useState<string>("5");
  const [questions, setQuestions] = useState<Question[]>(() => {
    if (
      typeof window !== "undefined" &&
      Array.isArray(window.__E2E_QUESTIONS__) &&
      window.__E2E_QUESTIONS__.length > 0
    ) {
      console.debug(
        "[E2E] Used window.__E2E_QUESTIONS__ for initial questions state",
      );
      return [...window.__E2E_QUESTIONS__];
    }
    if (
      typeof window !== "undefined" &&
      window.__E2E_TEST__ &&
      window.appState &&
      Array.isArray(window.appState.questions) &&
      window.appState.questions.length > 0
    ) {
      console.debug(
        "[E2E] Used window.appState.questions for initial questions state",
      );
      return [...window.appState.questions];
    }
    return [];
  });
  useEffect(() => {
    console.log(
      "[AppWithReactPanels] questions state changed. Length:",
      questions.length,
      "First 2:",
      questions.slice(0, 2),
    );
  }, [questions]);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [quizSessionId, setQuizSessionId] = useState(0);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [badgeDetailsOpen, setBadgeDetailsOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const recommendation = getSmartRecommendation();
  const { showNotification } = useNotification() as { showNotification: (msg: string, type?: string) => void };
  // 4. topics prop type is string[]
  const topics: string[] = React.useMemo(() => {
    const all = (questions || []).map((q: Question) => q.topic).filter(Boolean) as string[];
    return Array.from(new Set(all));
  }, [questions]);
  const quizLengths = [5, 10, 20, "all"];

  // 2. setUser only accepts User or null
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u ?? null);
      setSignedIn(!!u);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window.__E2E_TEST__ ||
        (Array.isArray(window.__E2E_QUESTIONS__) &&
          window.__E2E_QUESTIONS__.length > 0))
    ) {
      console.debug(
        "[E2E] Skipping questions fetch on mount, using injected state only",
      );
      return;
    }
    import("./quiz.jsx").then((mod) => {
      mod.getQuestions().then((qs: Question[]) => setQuestions(qs));
    });
  }, []);

  const handleSignInOut = () => {
    if (!signedIn) {
      signInWithGoogle();
      showNotification("Signed in!", "success");
    } else {
      signOutUser();
      showNotification("Signed out!", "info");
    }
  };

  useEffect(() => {
    if (!user || !user.uid) return;
    setLoadingProfile(true);
    setProfileError(null);
    const ref = doc(firestoreDb, "users", user.uid, "profile", "main");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setLoadingProfile(false);
        if (snap.exists()) {
          const data = snap.data();
          setAnalytics(data.analytics || null);
          setBadges(data.badges || undefined); // Fix: use undefined, not null
          window.firestoreAnalytics = data.analytics || null;
          window.lastAnalyticsSync = Date.now();
          console.log(
            "[Firestore] Reloaded analytics and badges from Firestore:",
            data,
          );
        } else {
          setAnalytics(null);
          setBadges(undefined);
          console.log("[Firestore] No profile data found for user:", user.uid);
        }
      },
      (err) => {
        setLoadingProfile(false);
        setProfileError(err.message || "Failed to load profile data");
        console.error("[Firestore] Error loading profile:", err);
      },
    );
    return () => unsub();
  }, [user && user.uid]);
  const syncStatsToFirestore = () => {
    if (!user || !user.uid) return;
    if (!analyticsCtx.analytics && !badgesCtx.badges) return;
    const ref = doc(firestoreDb, "users", user.uid, "profile", "main");
    setDoc(ref, { analytics: analyticsCtx.analytics, badges: badgesCtx.badges }, { merge: true })
      .then(() =>
        console.log("[Firestore] Saved analytics and badges to Firestore:", {
          analytics: analyticsCtx.analytics,
          badges: badgesCtx.badges,
        }),
      )
      .catch((err) => {
        setProfileError(err.message || "Failed to save profile data");
        console.error("[Firestore] Error saving profile:", err);
      });
  };

  useEffect(() => {
    if (
      getEnv("MODE", "") === "development" ||
      getEnv("VITE_E2E", false) ||
      window.__E2E_TEST__
    ) {
      window.setTestState = (patch: unknown) => {
        if (typeof patch !== "object" || patch === null) return;
        const p = patch as Record<string, unknown>;
        if (p.hasOwnProperty("questions") && Array.isArray(p.questions)) setQuestions(p.questions as Question[]);
        if (p.hasOwnProperty("selectedTopic") && typeof p.selectedTopic === "string") setSelectedTopic(p.selectedTopic);
        if (p.hasOwnProperty("selectedLength") && typeof p.selectedLength === "string") setSelectedLength(p.selectedLength);
        if (p.hasOwnProperty("analyticsOpen") && typeof p.analyticsOpen === "boolean") setAnalyticsOpen(p.analyticsOpen);
        if (p.hasOwnProperty("smartLearningOpen") && typeof p.smartLearningOpen === "boolean") setSmartLearningOpen(p.smartLearningOpen);
        if (p.hasOwnProperty("profileOpen") && typeof p.profileOpen === "boolean") setProfileOpen(p.profileOpen);
        if (analyticsCtx && typeof analyticsCtx.updateAnalytics === "function") {
          if (p.hasOwnProperty("quizHistory") && Array.isArray(p.quizHistory))
            analyticsCtx.updateAnalytics({ quizHistory: p.quizHistory as QuizHistoryItem[] });
          if (p.hasOwnProperty("masteryHistory") && Array.isArray(p.masteryHistory))
            analyticsCtx.updateAnalytics({ masteryHistory: p.masteryHistory as MasteryHistoryItem[] });
          if (p.hasOwnProperty("errorMap") && typeof p.errorMap === "object" && p.errorMap !== null && !Array.isArray(p.errorMap))
            analyticsCtx.updateAnalytics({ errorMap: p.errorMap as Record<string, unknown> });
        }
        if (badgesCtx && typeof badgesCtx.earnBadge === "function" && p.hasOwnProperty("badges")) {
          if (Array.isArray(p.badges)) {
            p.badges.forEach((badge: unknown) => {
              if (typeof badge === "string") {
                badgesCtx.earnBadge(badge);
              } else if (badge && typeof badge === "object" && "id" in badge && typeof (badge as { id: unknown }).id === "string") {
                badgesCtx.earnBadge((badge as { id: string }).id);
              }
            });
          }
        }
      };
    }
  }, [analyticsCtx, badgesCtx]);
  useEffect(() => {
    if (
      getEnv("MODE", "") === "development" ||
      getEnv("VITE_E2E", false) ||
      window.__E2E_TEST__
    ) {
      window.__REACT_SET_TEST_STATE__ = (patch: Record<string, unknown>) => {
        if (patch.hasOwnProperty("questions") && Array.isArray(patch.questions)) setQuestions(patch.questions as Question[]);
        if (patch.hasOwnProperty("selectedTopic") && typeof patch.selectedTopic === "string") setSelectedTopic(patch.selectedTopic);
        if (patch.hasOwnProperty("selectedLength") && typeof patch.selectedLength === "string") setSelectedLength(patch.selectedLength);
        if (patch.hasOwnProperty("analyticsOpen") && typeof patch.analyticsOpen === "boolean") setAnalyticsOpen(patch.analyticsOpen);
        if (patch.hasOwnProperty("smartLearningOpen") && typeof patch.smartLearningOpen === "boolean") setSmartLearningOpen(patch.smartLearningOpen);
        if (patch.hasOwnProperty("profileOpen") && typeof patch.profileOpen === "boolean") setProfileOpen(patch.profileOpen);
        if (analyticsCtx && typeof analyticsCtx.updateAnalytics === "function") {
          if (patch.hasOwnProperty("quizHistory") && Array.isArray(patch.quizHistory))
            analyticsCtx.updateAnalytics({ quizHistory: patch.quizHistory as QuizHistoryItem[] });
          if (patch.hasOwnProperty("masteryHistory") && Array.isArray(patch.masteryHistory))
            analyticsCtx.updateAnalytics({ masteryHistory: patch.masteryHistory as MasteryHistoryItem[] });
          if (patch.hasOwnProperty("errorMap") && typeof patch.errorMap === "object" && patch.errorMap !== null && !Array.isArray(patch.errorMap))
            analyticsCtx.updateAnalytics({ errorMap: patch.errorMap as Record<string, unknown> });
        }
        if (badgesCtx && typeof badgesCtx.earnBadge === "function" && patch.hasOwnProperty("badges")) {
          if (Array.isArray(patch.badges)) {
            patch.badges.forEach((badge: unknown) => {
              if (typeof badge === "string") {
                badgesCtx.earnBadge(badge);
              } else if (badge && typeof badge === "object" && "id" in badge && typeof (badge as { id: unknown }).id === "string") {
                badgesCtx.earnBadge((badge as { id: string }).id);
              }
            });
          }
        }
      };
    }
  }, [analyticsCtx, badgesCtx]);

  // E2E: Expose React-level setTestState for badge state
  useEffect(() => {
    if (
      getEnv("MODE", "") === "development" ||
      getEnv("VITE_E2E", false) ||
      window.__E2E_TEST__
    ) {
      window.__REACT_SET_TEST_STATE__ = (patch: Record<string, unknown>) => {
        if (patch.badges && Array.isArray(patch.badges)) {
          setBadges([...patch.badges]);
        }
      };
      return () => {
        window.__REACT_SET_TEST_STATE__ = undefined;
      };
    }
  }, []);

  // E2E: Listen for badge state change events and update React state
  useEffect(() => {
    if (
      getEnv("MODE", "") === "development" ||
      getEnv("VITE_E2E", false) ||
      window.__E2E_TEST__
    ) {
      const syncBadges = () => {
        if (typeof window !== "undefined" && Array.isArray(window.appState?.badges)) {
          setBadges([...window.appState.badges]);
        }
      };
      window.addEventListener("testStateChanged", syncBadges);
      window.addEventListener("badgesUpdated", syncBadges);
      return () => {
        window.removeEventListener("testStateChanged", syncBadges);
        window.removeEventListener("badgesUpdated", syncBadges);
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!window.appState) window.appState = {};
      if (!Array.isArray(window.appState.badges)) window.appState.badges = [];
      window.badges = window.appState.badges;
    }
  }, [badgesData]);

  useEffect(() => {
    if (typeof window !== "undefined" && analyticsData) {
      window.analytics = analyticsData;
    }
  }, [analyticsData]);

  useEffect(() => {
    function handleQuestionsUpdated() {
      if (window.appState && Array.isArray(window.appState.questions)) {
        setQuestions([...window.appState.questions]);
        console.debug(
          "[E2E] React questions state updated from appState.questions after questionsUpdated event",
        );
      }
    }
    window.addEventListener("questionsUpdated", handleQuestionsUpdated);
    return () =>
      window.removeEventListener("questionsUpdated", handleQuestionsUpdated);
  }, []);

  useEffect(() => {
    function handleTestStateChanged() {
      if (
        typeof window !== "undefined" &&
        window.appState &&
        Array.isArray(window.appState.questions)
      ) {
        setQuestions([...window.appState.questions]);
        console.debug(
          "[E2E] AppPanels: questions state updated from window.appState.questions after testStateChanged",
        );
      }
    }
    window.addEventListener("testStateChanged", handleTestStateChanged);
    return () =>
      window.removeEventListener("testStateChanged", handleTestStateChanged);
  }, []);

  const handleSelectTopic = useCallback((topic: string) => setSelectedTopic(topic), []);
  const handleSelectLength = useCallback((len: string) => setSelectedLength(len), []);
  const handleStartQuiz = useCallback(() => {}, []);
  const handleOpenSmartLearning = useCallback(
    () => setSmartLearningOpen(true),
    [],
  );
  const handleOpenAnalytics = useCallback(() => setAnalyticsOpen(true), []);
  const handleOpenSettings = useCallback(() => setSettingsOpen(true), []);
  const handleQuestionAnswered = useCallback((qid: string, answeredIdx: number) => {
    setQuestions((qs) =>
      qs.map((q: Question) =>
        q.id === qid
          ? {
              ...q,
              answered: answeredIdx,
              stats: (() => {
                try {
                  const stored = localStorage.getItem("questions");
                  if (stored) {
                    const arr = JSON.parse(stored);
                    const found = arr.find((qq: Question) => qq.id === qid);
                    return found && found.stats ? found.stats : q.stats;
                  }
                } catch {}
                return q.stats;
              })(),
            }
          : q,
      ),
    );
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__SHOW_BADGE_DETAILS_MODAL__ = (badge: { id: string }) => {
        setSelectedBadge(badge);
      };
    }
  }, []);

  const forceShowHeaderAndAnalyticsBtn =
    getEnv("MODE", "") === "development" ||
    getEnv("VITE_E2E", false) ||
    window.__E2E_TEST__;
  const alwaysShowHeader =
    getEnv("MODE", "") === "development" ||
    getEnv("VITE_E2E", false) ||
    window.__E2E_TEST__;
  if ((loadingProfile || profileError) && !alwaysShowHeader) {
    if (loadingProfile)
      return (
        <div style={{ textAlign: "center", margin: 40 }}>
          <span>Loading profile...</span>
        </div>
      );
    if (profileError)
      return (
        <div style={{ color: "#f66", textAlign: "center", margin: 40 }}>
          <b>Error:</b> {profileError}
        </div>
      );
  }

  if (alwaysShowHeader) {
    console.debug(
      "[E2E/DEV] Forcing header/header actions render for E2E/dev mode",
    );
  }

  return (
    <div className="main-app-layout">
      {(getEnv("MODE", "") === "development" ||
        getEnv("VITE_E2E", false) ||
        window.__E2E_TEST__) && (
        <button
          style={{
            position: "fixed",
            top: 8,
            right: 8,
            zIndex: 1000,
            background: "#222",
            color: "#fff",
            border: "1px solid #444",
            borderRadius: 4,
            padding: "4px 10px",
            fontSize: 12,
            opacity: 0.7,
            cursor: "pointer",
          }}
          data-testid="toggle-debug-panel"
          onClick={() => setShowDebugPanel((v) => !v)}
        >
          {showDebugPanel ? "Hide Debug Panel" : "Show Debug Panel"}
        </button>
      )}
      {(getEnv("MODE", "") === "development" ||
        getEnv("VITE_E2E", false) ||
        window.__E2E_TEST__) && (
        <DebugPanel
          appState={{
            badgesData,
            analyticsData,
            questions,
            quizHistory: analyticsCtx.quizHistory,
            masteryHistory: analyticsCtx.masteryHistory,
            errorMap: analyticsCtx.errorMap,
          }}
          visible={showDebugPanel}
        />
      )}
      <header
        style={
          forceShowHeaderAndAnalyticsBtn
            ? { outline: "3px solid #0f0", background: "#1a1", opacity: 0.98 }
            : {}
        }
      >
        <div className="app-container">
          <div className="title-bar-box">
            <div className="title-bar">
              <img
                alt="App Icon"
                className="app-icon"
                src="/icon-512x512.png"
                style={{
                  width: 48,
                  height: 48,
                  marginRight: 16,
                  background: "#fff",
                  borderRadius: 8,
                }}
              />
              <div className="title-text">
                <h1>Massage Therapy Smart Study Pro</h1>
              </div>
              <ProfileAvatar user={user} onClick={() => setProfileOpen(true)} />
            </div>
            <HeaderControls
              topics={topics}
              selectedTopic={selectedTopic}
              onSelectTopic={handleSelectTopic}
              quizLengths={quizLengths}
              selectedLength={selectedLength}
              onSelectLength={handleSelectLength}
              onStartQuiz={handleStartQuiz}
            />
            <HeaderActions
              onOpenSmartLearning={handleOpenSmartLearning}
              onOpenAnalytics={handleOpenAnalytics}
              onOpenSettings={handleOpenSettings}
            />
            {forceShowHeaderAndAnalyticsBtn && (
              <div
                style={{
                  color: "#0f0",
                  fontWeight: "bold",
                  fontSize: 14,
                  marginTop: 8,
                }}
                data-testid="e2e-header-debug-msg"
              >
                [E2E/DEV] Header and analytics button always rendered for
                E2E/dev mode
              </div>
            )}
          </div>
        </div>
      </header>
      {(getEnv("MODE", "") === "development" ||
        getEnv("VITE_E2E", false) ||
        window.__E2E_TEST__) && (
        <div
          style={{
            background: "#ff0",
            color: "#222",
            padding: "4px 12px",
            fontWeight: "bold",
            fontSize: 14,
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 2000,
          }}
          data-testid="e2e-header-debug-banner"
        >
          [E2E/DEV] Header and analytics button rendered
        </div>
      )}
      <div className="main-content">
        <div className="center-panel">
          {/* Refactored: Compute quizCardProps and render a single QuizCardWrapper if questions exist */}
          {Array.isArray(questions) && questions.length > 0 ? (
            <QuizCardWrapper
              key={quizSessionId}
              questions={questions}
              selectedTopic={
                getEnv("MODE", "") === "development" ||
                getEnv("VITE_E2E", false) ||
                window.__E2E_TEST__
                  ? selectedTopic ||
                    (questions[0] && questions[0].topic) ||
                    "E2E"
                  : selectedTopic
              }
              quizLength={
                getEnv("MODE", "") === "development" ||
                getEnv("VITE_E2E", false) ||
                window.__E2E_TEST__
                  ? selectedLength || "5"
                  : selectedLength
              }
              onToggleBookmarks={() => setBookmarksOpen((o) => !o)}
              onRestartQuiz={() => {
                setQuizSessionId((id) => id + 1);
              }}
              onStatsUpdate={syncStatsToFirestore}
              onQuestionAnswered={handleQuestionAnswered}
            />
          ) : (
            <div
              className="quiz-card visible no-questions"
              role="region"
              aria-label="Quiz Area"
              data-testid="quiz-card-empty"
            >
              Loading questions…
            </div>
          )}
          {(getEnv("MODE", "") === "development" ||
            getEnv("VITE_E2E", false) ||
            window.__E2E_TEST__) &&
            signedIn && (
              <button
                data-testid="profile-btn"
                className="app-btns"
                style={{
                  margin: "8px 0",
                  padding: "8px 20px",
                  fontSize: 16,
                  borderRadius: 8,
                  background: "#3A86FF",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px #0003",
                }}
                onClick={() => setProfileOpen(true)}
              >
                Open Profile
              </button>
            )}
          <QuestionSearch questions={questions} />
          {Array.isArray(questions) &&
            questions.length > 0 &&
            ((window.__E2E_TEST__ && Array.isArray(window.bookmarks) && window.bookmarks.length > 0) ||
              (!window.__E2E_TEST__ && typeof window !== "undefined" && window.localStorage && (() => {
                try {
                  const parsed = JSON.parse(window.localStorage.getItem("bookmarks") || "{}");
                  return Array.isArray(parsed.items) && parsed.items.length > 0;
                } catch {
                  return false;
                }
              })())) && (
              <button
                data-testid="bookmarks-sidebar-btn"
                className="app-btns"
                style={{
                  position: "fixed",
                  left: 16,
                  top: 80,
                  zIndex: 1000,
                  background: "#FFD93D",
                  color: "#222",
                  border: "1px solid #FFD93D",
                  borderRadius: 6,
                  padding: "8px 16px",
                  fontWeight: 600,
                  boxShadow: "0 2px 8px #0002",
                }}
                onClick={() => setBookmarksOpen(true)}
              >
                Show bookmarks list
              </button>
            )}
        </div>
        <BookmarkedSidebar
          questions={questions}
          open={bookmarksOpen}
          setOpen={setBookmarksOpen}
        />
      </div>
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={user}
        darkMode={darkMode}
        soundEnabled={soundEnabled}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        onToggleSound={handleToggleSound}
        onSignInOut={handleSignInOut}
        signedIn={signedIn}
        onOpenSettings={() => {
          setProfileOpen(false);
          setSettingsOpen(true);
        }}
        onOpenSmartLearning={() => {
          setProfileOpen(false);
          setSmartLearningOpen(true);
        }}
        onOpenAnalytics={() => {
          setProfileOpen(false);
          setAnalyticsOpen(true);
        }}
      />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        darkMode={darkMode}
        soundEnabled={soundEnabled}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        onToggleSound={handleToggleSound}
        onSignInOut={handleSignInOut}
        signedIn={signedIn}
        onDownloadOffline={() => {
          downloadQuestionsForOffline();
          showNotification("Questions downloaded for offline use!", "success");
        }}
      />
      <AnalyticsModal
        open={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
        analytics={analyticsCtx.analytics}
        quizHistory={analyticsCtx.quizHistory}
        masteryHistory={analyticsCtx.masteryHistory}
        errorMap={analyticsCtx.errorMap}
        questions={questions}
        badges={badgesCtx.badges}
      />
      <SmartLearningModal
        open={smartLearningOpen}
        onClose={() => setSmartLearningOpen(false)}
        recommendation={recommendation}
      />
      <BadgeProgressPanel context={appState} />
      <BadgeDetailsModal
        open={badgeDetailsOpen}
        badge={selectedBadge}
        onClose={() => setBadgeDetailsOpen(false)}
      />
    </div>
  );
}

export default AppPanels;
