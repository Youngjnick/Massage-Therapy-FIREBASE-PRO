import React, { useState, useEffect, useCallback } from "react";
import AnalyticsModal from "./AnalyticsModal.jsx";
import SmartLearningModal from "./SmartLearningModal.jsx";
import ProfileModal from "./ProfileModal.jsx";
import SettingsModal from "./SettingsModal.jsx";
import { NotificationProvider, useNotification } from "./NotificationProvider.jsx";
import QuestionSearch from "./QuestionSearch.jsx";
import { getSmartRecommendation } from "../utils/index.js";
import { auth } from "../firebase/indexFirebase.js";
import { signInWithGoogle, signOutUser } from "./auth.jsx";
import { downloadQuestionsForOffline } from "./quiz.jsx";
import HeaderControls from "./HeaderControls.jsx";
import HeaderActions from "./HeaderActions.jsx";
import QuizCard from "./QuizCard.jsx";
import DebugPanel from "./DebugPanel.jsx";
import { BookmarkProvider } from "./BookmarkContext.jsx";
import BookmarkedSidebar from "./BookmarkedSidebar.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import { BadgeProvider } from "./BadgeContext.jsx";
import { useAnalytics } from "./AnalyticsContext.jsx";
import { useBadges } from "./BadgeContext.jsx";
import ProfileAvatar from "./ProfileAvatar.jsx";
import { firestoreDb } from "../firebase/indexFirebase.js";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

function QuizCardWrapper(props) {
  const { updateAnalytics, quizHistory, masteryHistory, errorMap } = useAnalytics();
  // Only update analytics when questions or answers change, not during render
  React.useEffect(() => {
    // Calculate quiz history, mastery history, and error map from props.questions
    const now = Date.now();
    const questions = props.questions || [];
    // Quiz history: array of {score, total, date, streak}
    let correct = 0, streak = 0, bestStreak = 0;
    let quizResults = [];
    let masteryArr = [];
    let errorMapObj = {};
    // Example: calculate stats for the current quiz session
    if (questions.length > 0) {
      // For demo, treat all questions as one session
      correct = questions.filter(q => q.answered && q.answered === q.correct).length;
      streak = 0;
      bestStreak = 0;
      let currStreak = 0;
      questions.forEach(q => {
        if (q.answered === q.correct) {
          currStreak++;
          bestStreak = Math.max(bestStreak, currStreak);
        } else {
          currStreak = 0;
        }
      });
      quizResults = [{ score: correct, total: questions.length, date: now, streak: bestStreak }];
      // Mastery: average correct/total per topic
      let topicMap = {};
      questions.forEach(q => {
        if (!q.topic) return;
        if (!topicMap[q.topic]) topicMap[q.topic] = { correct: 0, total: 0 };
        if (q.answered === q.correct) topicMap[q.topic].correct++;
        topicMap[q.topic].total++;
      });
      const avgMastery = Object.values(topicMap).length
        ? Math.round(
            Object.values(topicMap).reduce((a, t) => a + (t.correct / (t.total || 1)), 0) /
              Object.values(topicMap).length * 100
          )
        : 0;
      masteryArr = [{ date: now, avgMastery }];
      // Error map: { [qid]: { [date]: count } }
      errorMapObj = {};
      questions.forEach(q => {
        if (q.answered !== undefined && q.answered !== q.correct) {
          if (!errorMapObj[q.id]) errorMapObj[q.id] = {};
          errorMapObj[q.id][now] = (errorMapObj[q.id][now] || 0) + 1;
        }
      });
    }
    updateAnalytics({
      correct,
      streak: bestStreak,
      total: questions.length,
      completed: 0,
      quizHistory: quizResults,
      masteryHistory: masteryArr,
      errorMap: errorMapObj,
    });
  }, [props.questions, props.selectedTopic, props.quizLength]);
  return <QuizCard {...props} onQuestionAnswered={props.onQuestionAnswered} />;
}

function AppPanels({ appState }) {
  // Defensive: always initialize window.appState and window.badges for E2E reliability
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.appState) window.appState = {};
      if (!Array.isArray(window.appState.badges)) window.appState.badges = [];
      window.badges = window.appState.badges;
    }
  }, []);

  const { quizHistory, masteryHistory, errorMap, analytics } = useAnalytics();
  const { badges } = useBadges();
  // --- E2E/Playwright test state sync ---
  const [testState, setTestState] = useState(() => ({ ...window.appState }));

  // Always sync testState with window.appState on testStateChanged, and on mount/reload
  useEffect(() => {
    function handleTestStateChanged() {
      setTestState({ ...window.appState });
      console.log('[E2E] testStateChanged event received, updating testState:', window.appState);
    }
    window.addEventListener('testStateChanged', handleTestStateChanged);
    // On mount, always sync from window.appState (for reload reliability)
    setTestState({ ...window.appState });
    return () => window.removeEventListener('testStateChanged', handleTestStateChanged);
  }, []);

  // Also, poll window.appState for changes every 100ms (for E2E reliability after reload/quiz completion)
  useEffect(() => {
    let last = JSON.stringify(window.appState);
    const interval = setInterval(() => {
      const curr = JSON.stringify(window.appState);
      if (curr !== last) {
        setTestState({ ...window.appState });
        last = curr;
        console.log('[E2E] Detected window.appState change, forced testState update:', window.appState);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [smartLearningOpen, setSmartLearningOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [user, setUser] = useState(auth.currentUser || {});
  const [analyticsData, setAnalytics] = useState(null);
  const [badgesData, setBadges] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [darkMode, setDarkMode] = useState(() => document.body.classList.contains("dark-mode"));
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("soundEnabled") === "true");
  const [signedIn, setSignedIn] = useState(!!auth.currentUser);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedLength, setSelectedLength] = useState("5");
  const [quizStarted, setQuizStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [quizSessionId, setQuizSessionId] = useState(0);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const recommendation = getSmartRecommendation();
  const { showNotification } = useNotification();
  const topics = React.useMemo(() => {
    // Extract unique topic names from questions
    const all = (questions || []).map(q => q.topic).filter(Boolean);
    return Array.from(new Set(all));
  }, [questions]);
  const quizLengths = [5, 10, 20, "all"];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(u => {
      setUser(u || {});
      setSignedIn(!!u);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("soundEnabled", soundEnabled);
  }, [darkMode, soundEnabled]);

  useEffect(() => {
    // Fetch questions on mount
    import("./quiz.jsx").then(mod => {
      mod.getQuestions().then(qs => setQuestions(qs));
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

  // Firestore: Load analytics and badges on sign-in (with loading, error, and real-time sync)
  useEffect(() => {
    if (!user || !user.uid) return;
    setLoadingProfile(true);
    setProfileError(null);
    const ref = doc(firestoreDb, "users", user.uid, "profile", "main");
    // Real-time sync
    const unsub = onSnapshot(ref, (snap) => {
      setLoadingProfile(false);
      if (snap.exists()) {
        const data = snap.data();
        setAnalytics(data.analytics || null);
        setBadges(data.badges || null);
        window.firestoreAnalytics = data.analytics || null;
        window.lastAnalyticsSync = Date.now();
        console.log('[Firestore] Reloaded analytics and badges from Firestore:', data);
      } else {
        setAnalytics(null);
        setBadges(null);
        console.log('[Firestore] No profile data found for user:', user.uid);
      }
    }, (err) => {
      setLoadingProfile(false);
      setProfileError(err.message || "Failed to load profile data");
      console.error('[Firestore] Error loading profile:', err);
    });
    return () => unsub();
  }, [user && user.uid]);
  // Firestore: Save analytics and badges on change
  const syncStatsToFirestore = () => {
    if (!user || !user.uid) return;
    if (analytics == null && badges == null) return;
    const ref = doc(firestoreDb, "users", user.uid, "profile", "main");
    setDoc(ref, { analytics, badges }, { merge: true })
      .then(() => console.log('[Firestore] Saved analytics and badges to Firestore:', { analytics, badges }))
      .catch((err) => {
        setProfileError(err.message || "Failed to save profile data");
        console.error('[Firestore] Error saving profile:', err);
      });
  };

  // --- E2E TEST HOOK: Expose setTestState for Playwright ---
  useEffect(() => {
    if (
      import.meta.env.MODE === "development" ||
      import.meta.env.VITE_E2E ||
      window.__E2E_TEST__
    ) {
      window.setTestState = (patch) => {
        let analyticsRelated = false;
        if (patch.hasOwnProperty("questions")) { setQuestions(patch.questions); analyticsRelated = true; }
        if (patch.hasOwnProperty("quizStarted")) setQuizStarted(patch.quizStarted);
        if (patch.hasOwnProperty("selectedTopic")) setSelectedTopic(patch.selectedTopic);
        if (patch.hasOwnProperty("selectedLength")) setSelectedLength(patch.selectedLength);
        if (patch.hasOwnProperty("analyticsOpen")) setAnalyticsOpen(patch.analyticsOpen);
        if (patch.hasOwnProperty("smartLearningOpen")) setSmartLearningOpen(patch.smartLearningOpen);
        if (patch.hasOwnProperty("profileOpen")) setProfileOpen(patch.profileOpen);
        // If any analytics-related state is set, open analytics modal for E2E
        if (
          patch.hasOwnProperty("quizResults") ||
          patch.hasOwnProperty("badges") ||
          patch.hasOwnProperty("masteryHistory") ||
          patch.hasOwnProperty("errorMap") ||
          patch.hasOwnProperty("sessionHistory") ||
          analyticsRelated
        ) {
          setAnalyticsOpen(true);
        }
      };
    }
  }, []);

  // Always keep window.__E2E_DEBUG_STATE__ in sync with latest React state
  useEffect(() => {
    if (
      import.meta.env.MODE === "development" ||
      import.meta.env.VITE_E2E ||
      window.__E2E_TEST__
    ) {
      window.__E2E_DEBUG_STATE__ = {
        badgesData,
        analyticsData,
        questions,
        quizHistory,
        masteryHistory,
        errorMap
      };
    }
  }, [badgesData, analyticsData, questions, quizHistory, masteryHistory, errorMap]);

  // --- E2E PATCH: Keep window.badges in sync with window.appState.badges for E2E/debug reliability ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.appState) window.appState = {};
      if (!Array.isArray(window.appState.badges)) window.appState.badges = [];
      window.badges = window.appState.badges;
    }
  }, [testState, badgesData]);

  // --- E2E PATCH: Keep window.analytics in sync with analyticsData for E2E/debug reliability ---
  useEffect(() => {
    if (typeof window !== 'undefined' && analyticsData) {
      window.analytics = analyticsData;
    }
  }, [analyticsData]);

  const handleSelectTopic = useCallback((topic) => setSelectedTopic(topic), []);
  const handleSelectLength = useCallback((len) => setSelectedLength(len), []);
  const handleStartQuiz = useCallback(() => setQuizStarted(true), []);
  const handleOpenSmartLearning = useCallback(() => setSmartLearningOpen(true), []);
  const handleOpenAnalytics = useCallback(() => setAnalyticsOpen(true), []);
  const handleOpenSettings = useCallback(() => setSettingsOpen(true), []);

  // Add callback to update answered state
  const handleQuestionAnswered = useCallback((qid, answeredIdx) => {
    setQuestions(qs =>
      qs.map(q =>
        q.id === qid ? { ...q, answered: answeredIdx } : q
      )
    );
  }, []);

  // Show loading or error UI
  if (loadingProfile) return <div style={{textAlign:'center',margin:40}}><span>Loading profile...</span></div>;
  if (profileError) return <div style={{color:'#f66',textAlign:'center',margin:40}}><b>Error:</b> {profileError}</div>;

  return (
    <div className="main-app-layout">
      {/* Toggle button for debug panel */}
      {(import.meta.env.MODE === "development" || import.meta.env.VITE_E2E || window.__E2E_TEST__) && (
        <button
          style={{
            position: 'fixed',
            top: 8,
            right: 8,
            zIndex: 1000,
            background: '#222',
            color: '#fff',
            border: '1px solid #444',
            borderRadius: 4,
            padding: '4px 10px',
            fontSize: 12,
            opacity: 0.7,
            cursor: 'pointer'
          }}
          data-testid="toggle-debug-panel"
          onClick={() => setShowDebugPanel(v => !v)}
        >
          {showDebugPanel ? 'Hide Debug Panel' : 'Show Debug Panel'}
        </button>
      )}
      {/* Remove legacy <pre> debug JSON block, always render DebugPanel for dev/E2E, toggle visibility with prop */}
      {(import.meta.env.MODE === "development" || import.meta.env.VITE_E2E || window.__E2E_TEST__) && (
        <DebugPanel
          appState={{ badgesData, analyticsData, questions, quizHistory, masteryHistory, errorMap }}
          visible={showDebugPanel}
        />
      )}
      <header>
        <div className="app-container">
          <div className="title-bar-box">
            <div className="title-bar">
              <img
                alt="App Icon"
                className="app-icon"
                src="/icon-512x512.png"
                style={{ width: 48, height: 48, marginRight: 16, background: '#fff', borderRadius: 8 }}
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
          </div>
        </div>
      </header>
      <div className="main-content">
        <div className="center-panel">
          <QuizCardWrapper
            key={quizSessionId}
            questions={questions}
            selectedTopic={selectedTopic}
            quizLength={selectedLength}
            onToggleBookmarks={() => setBookmarksOpen(o => !o)}
            onRestartQuiz={() => {
              setQuizStarted(false);
              setTimeout(() => {
                setQuizSessionId(id => id + 1);
                setQuizStarted(true);
              }, 0);
            }}
            onStatsUpdate={syncStatsToFirestore}
            onQuestionAnswered={handleQuestionAnswered}
          />
          <QuestionSearch questions={questions} />
        </div>
        <BookmarkedSidebar questions={questions.filter(q => /* filter for bookmarked only if needed */ true)} open={bookmarksOpen} setOpen={setBookmarksOpen} />
      </div>
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        user={user}
        darkMode={darkMode}
        soundEnabled={soundEnabled}
        onToggleDarkMode={() => setDarkMode(d => !d)}
        onToggleSound={() => setSoundEnabled(s => !s)}
        onSignInOut={handleSignInOut}
        signedIn={signedIn}
        onOpenSettings={() => { setProfileOpen(false); setSettingsOpen(true); }}
        onOpenSmartLearning={() => { setProfileOpen(false); setSmartLearningOpen(true); }}
        onOpenAnalytics={() => { setProfileOpen(false); setAnalyticsOpen(true); }}
      />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        darkMode={darkMode}
        soundEnabled={soundEnabled}
        onToggleDarkMode={() => setDarkMode(d => !d)}
        onToggleSound={() => setSoundEnabled(s => !s)}
        onSignInOut={handleSignInOut}
        signedIn={signedIn}
        onDownloadOffline={() => { downloadQuestionsForOffline(); showNotification("Questions downloaded for offline use!", "success"); }}
      />
      <AnalyticsModal
        open={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
        analytics={analytics}
        quizHistory={quizHistory}
        masteryHistory={masteryHistory}
        errorMap={errorMap}
        questions={questions}
        appState={{
          badges: (window && window.appState && Array.isArray(window.appState.badges)) ? window.appState.badges : [],
          ...window.appState
        }}
      />
      <SmartLearningModal open={smartLearningOpen} onClose={() => setSmartLearningOpen(false)} recommendation={recommendation} />
      {/* Remove DebugPanel from here: <DebugPanel appState={testState} /> */}
    </div>
  );
}

export default function AppWithReactPanels({ appState }) {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <BookmarkProvider>
          <BadgeProvider>
            <AppPanels appState={appState} />
            {/* Removed duplicate DebugPanel here */}
          </BadgeProvider>
        </BookmarkProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}
