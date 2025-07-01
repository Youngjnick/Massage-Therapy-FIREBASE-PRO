// NOTE: Always ensure that `started` and `showResults` are mutually exclusive (never true at the same time) to prevent quiz card and results/review from rendering together.

import React, { useEffect, useState, useRef } from 'react';
import { getQuestions } from '../questions/index';
import { getBookmarks } from '../bookmarks/index';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import QuizQuestionCard from '../components/Quiz/QuizQuestionCard';
import QuizProgressBar from '../components/Quiz/QuizProgressBar';
import QuizStepper from '../components/Quiz/QuizStepper';
import QuizStartForm from '../components/Quiz/QuizStartForm';
import { useQuizToggles } from '../hooks/useQuizToggles';
import { useQuizState } from '../hooks/useQuizState';
import { getFilteredSortedQuestions } from '../utils/quizFiltering';
import { db } from '../firebaseClient';
import { setDoc } from 'firebase/firestore';
import QuizResultsScreen from '../components/Quiz/QuizResultsScreen';
import QuizReviewScreen from '../components/Quiz/QuizReviewScreen';
import QuizTopicProgress from '../components/Quiz/QuizTopicProgress';
import { useQuizData } from '../hooks/useQuizData';
import { updateQuizStatsOnFinish, updateQuizStatsOnAnswer } from '../services/quizStatsService';
import Spinner from '../components/common/Spinner';

// Get initial toggle state from localStorage if available
let initialToggleState = undefined;
if (typeof window !== 'undefined') {
  try {
    const stored = window.localStorage.getItem('quizToggleState');
    if (stored) initialToggleState = JSON.parse(stored);
  } catch { /* ignore localStorage errors */ }
}
const Quiz: React.FC = () => {
  const [firestoreStatus, setFirestoreStatus] = useState<string>('');
  const [firestoreDoc, setFirestoreDoc] = useState<any>(null);
  const [firestoreUid, setFirestoreUid] = useState<string>('');
  const [firestoreDocPath, setFirestoreDocPath] = useState<string>('');

  // Helper to fetch Firestore quizProgress doc for current user
  const fetchFirestoreDoc = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        setFirestoreUid(user.uid);
        const progressRef = doc(db, 'users', user.uid, 'quizProgress', 'current');
        setFirestoreDocPath(progressRef.path);
        const progressSnap = await getDoc(progressRef);
        setFirestoreDoc(progressSnap.exists() ? progressSnap.data() : null);
      } else {
        setFirestoreUid('NO_USER');
        setFirestoreDocPath('');
        setFirestoreDoc(null);
      }
    } catch (err) {
      setFirestoreDoc({ error: String(err) });
    }
  };

  // Remove local questions, setQuestions, loading, setLoading
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [toggleState, setToggleState] = useQuizToggles(initialToggleState);
  const {
    started,
    setStarted,
    showResults,
    setShowResults,
    current,
    setCurrent,
    userAnswers,
    setUserAnswers,
    shuffledQuestions,
    setShuffledQuestions,
    shuffledOptions,
    setShuffledOptions,
    filter,
    setFilter,
    filterValue,
    setFilterValue,
    setSort,
  } = useQuizState();
  const [reviewMode] = useState(false);
  const [liveTopicStats, setLiveTopicStats] = useState<{ [topic: string]: { correct: number; total: number } } | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortedTopics, setSortedTopics] = useState<string[]>([]);

  const quizCompleted = React.useRef(false); // Prevent further writes after completion

  // Use modularized data hook
  const { questions, setQuestions, loading, setLoading } = useQuizData(selectedTopic, setSelectedTopic);

  // Reset filter and filterValue on quiz start
  useEffect(() => {
    if (!started) {
      setFilter('all');
      setFilterValue('');
    }
  }, [started]);

  // --- Filtering ---
  const quizQuestions = getFilteredSortedQuestions(
    questions,
    selectedTopic,
    filter,
    filterValue,
    userAnswers,
    shuffledOptions
  );
  const activeQuestions = started ? shuffledQuestions : quizQuestions;
  const q = activeQuestions[current];

  // --- Derived variables (declare after quizQuestions/activeQuestions) ---
  const maxQuizLength = quizQuestions.length;
  // User can select a desired quiz length, but always clamp to available range
  const [desiredQuizLength, setDesiredQuizLength] = useState<number | ''>(5);
  // Compute quizLength: if empty string, treat as 0
  const quizLength = desiredQuizLength === '' ? 0 : (maxQuizLength === 0 ? 0 : Math.max(1, Math.min(desiredQuizLength, maxQuizLength)));
  const totalQuestions = started ? shuffledQuestions.length : quizQuestions.length;
  const progress = totalQuestions > 0 ? Math.round((userAnswers.filter((a) => a !== undefined).length / totalQuestions) * 100) : 0;

  // --- All hooks must be called unconditionally at the top level ---
  // Load questions and bookmarks on component mount
  useEffect(() => {
    getQuestions()
      .then((qs) => {
        setQuestions(qs);
        console.log('[E2E DEBUG] getQuestions resolved', qs.length, 'questions');
        // Extract unique topics (use the last topic for each question)
        const topics = Array.from(new Set(qs.map((q: any) => (q.topics && q.topics[q.topics.length - 1]) || 'Other')));
        const sorted = [...topics].sort((a, b) => a.localeCompare(b));
        setSortedTopics(sorted);
        // Set default topic to the first alphabetically
        if (!selectedTopic && sorted.length > 0) setSelectedTopic(sorted[0]);
      })
      .catch((err) => {
        setWarning('Error: Failed to load questions. Could not load questions.');
        setError('Error: Failed to load questions. Could not load questions.');
        console.error('[E2E DEBUG] getQuestions failed', err);
      })
      .finally(() => {
        setLoading(false);
        console.log('[E2E DEBUG] setLoading(false) after getQuestions');
      });

    // Load bookmarks from Firebase on start (replace 'userId' with real user id)
    getBookmarks('demoUser');

    // Load user settings from Firestore on mount
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
  }, []);

  // Load user stats for filtering/sorting
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
  }, [started]);

  // Accessibility: Keyboard navigation and focus
  useEffect(() => {
    if (started && q) {
      const idx = userAnswers[current] ?? 0;
      const option = document.querySelector(`input[type="radio"][name="question-${current}-option-${idx}"]`);
      // Fix: Cast to HTMLElement before calling focus
      if (option && 'focus' in option && typeof (option as HTMLElement).focus === 'function') {
        (option as HTMLElement).focus();
      }
    }
    if (!started) return;
    const handleKey = (e: KeyboardEvent) => {
      // Only handle Arrow keys for question navigation if NOT focused on a quiz radio input
      const active = document.activeElement;
      // If a quiz radio is focused, do nothing (let browser handle)
      if (active && (active as HTMLElement).hasAttribute && (active as HTMLElement).hasAttribute('data-quiz-radio')) {
        // Prevent default to stop propagation to global handler
        return;
      }
      // If any input or textarea is focused, do nothing
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
        return;
      }
      // Only handle Arrow keys if NOT focused on any input
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        // Only allow left/right to navigate quiz cards
        e.preventDefault();
        if (e.key === 'ArrowRight') next();
        else prev();
        return;
      }
      // ArrowUp/ArrowDown do nothing globally (let browser handle for radios)
      if (/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (q && q.options[idx]) handleAnswer(idx);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [current, started, q]);

  const startQuiz = () => {
    setStarted(true);
    setLoading(true);
    setCurrent(0);
    setUserAnswers(Array(quizLength).fill(undefined));
    setShowResults(false);
    // Shuffle questions
    let qs = [...quizQuestions];
    if (toggleState.randomizeQuestions) {
      for (let i = qs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [qs[i], qs[j]] = [qs[j], qs[i]];
      }
    }
    // Only use the first N questions for the quiz
    qs = qs.slice(0, quizLength);
    setShuffledQuestions(qs);
    // Shuffle options for each question
    const so: { [key: number]: string[] } = {};
    qs.forEach((q, i) => {
      so[i] = [...(q.options || [])];
      if (toggleState.randomizeOptions) {
        for (let j = so[i].length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1));
          [so[i][j], so[i][k]] = [so[i][k], so[i][j]];
        }
      }
    });
    setShuffledOptions(so);
    setLoading(false);
  };

  const next = () => {
    setCurrent((c) => Math.min(c + 1, activeQuestions.length));
  };

  const prev = () => {
    setCurrent((c) => Math.max(c - 1, 0));
  };

  // In the answer submission handler, ensure Firestore setDoc is called after answering a question
  const handleAnswer = async (idx: number) => {
    console.log('[E2E DEBUG] handleAnswer called', { idx, current, showResults, userAnswers });
    if (showResults || quizCompleted.current) return; // Ignore answers after quiz is completed
    const newAnswers = [...userAnswers];
    newAnswers[current] = idx;
    setUserAnswers(newAnswers);
    await updateQuizStatsOnAnswer({
      userAnswers: newAnswers,
      shuffledQuestions,
      shuffledOptions,
      started,
      quizQuestions
    });
    // Only save with showResults: false if not finished and not on last question
    if (!showResults && current < quizQuestions.length - 1 && !quizCompleted.current) {
      // Extra guard: do not write if quiz is completed or showResults is true
      if (quizCompleted.current || showResults) return;
      const progress = {
        started: true,
        current,
        userAnswers: newAnswers,
        shuffledQuestions,
        shuffledOptions,
        showResults: false
      };
      console.log('[E2E DEBUG] Firestore write (progress)', { ...progress, ts: Date.now() });
      await saveQuizProgress(progress);
    }
    console.log('[E2E DEBUG] handleAnswer finished', { idx, current, newAnswers });
  };

  // --- Firestore analytics update at quiz finish ---
  useEffect(() => {
    if (!showResults) return;
    (async () => {
      try {
        await updateQuizStatsOnFinish({
          userAnswers,
          shuffledQuestions,
          shuffledOptions,
          started,
          quizQuestions
        });
      } catch {
        setError('Error: Failed to submit results. Could not submit your quiz results.');
      }
    })();
  }, [showResults]);

  // --- Firestore analytics update on every answer (except quiz finish) ---
  useEffect(() => {
    if (!started || showResults) return;
    // Only update if at least one answer is present
    if (!userAnswers.some(a => a !== undefined)) return;
    updateQuizStatsOnAnswer({
      userAnswers,
      shuffledQuestions,
      shuffledOptions,
      started,
      quizQuestions
    });
  }, [started, showResults, userAnswers, shuffledQuestions, quizQuestions, shuffledOptions]);

  // --- topicStats is used for results UI ---
  const topicStats = React.useMemo(() => {
    const stats: { [topic: string]: { correct: number; total: number } } = {};
    (started ? shuffledQuestions : quizQuestions).forEach((q, i) => {
      const topic = (q.topics && q.topics.at(-1)) || 'Other';
      if (!stats[topic]) stats[topic] = { correct: 0, total: 0 };
      stats[topic].total++;
      if (userAnswers[i] !== undefined && (shuffledOptions[i] || q.options)[userAnswers[i]] === q.correctAnswer) {
        stats[topic].correct++;
      }
    });
    return stats;
  }, [started, shuffledQuestions, quizQuestions, userAnswers, shuffledOptions]);

  // On quiz start, trigger initial Firestore stats write (all answers undefined)
  useEffect(() => {
    if (!started) return;
    (async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          const stats: { [topic: string]: { correct: number; total: number } } = {};
          (shuffledQuestions.length ? shuffledQuestions : quizQuestions).forEach((q) => {
            const topic = (q.topics && q.topics.at(-1)) || 'Other';
            if (!stats[topic]) stats[topic] = { correct: 0, total: 0 };
            stats[topic].total++;
          });
          const correct = 0;
          const total = Object.values(stats).reduce((sum, s) => sum + s.total, 0);
          const analyticsRef = doc(db, 'users', user.uid, 'stats', 'analytics');
          const prevSnap = await getDoc(analyticsRef);
          const prevAnalytics = prevSnap.exists() ? prevSnap.data() : {};
          const badgeProgress = { ...prevAnalytics.badgeProgress, correct: correct };
          await setDoc(
            analyticsRef,
            {
              correct,
              total,
              streak: prevAnalytics.streak || 0,
              badges: prevAnalytics.badges || 0,
              badgeProgress,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
          const topicStatsRef = doc(db, 'users', user.uid, 'stats', 'topicStats');
          await setDoc(topicStatsRef, stats, { merge: true });
        }
      } catch (err) {
        console.error('Failed to write initial Firestore stats on quiz start:', err);
      }
    })();
  }, [started]);

  // Listen for Firestore topicStats updates when results are shown
  useEffect(() => {
    if (!showResults) return;
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    // Dynamically import onSnapshot to avoid SSR issues
    let unsubscribe: (() => void) | undefined;
    import('firebase/firestore').then(({ doc, onSnapshot }) => {
      const topicStatsRef = doc(db, 'users', user.uid, 'stats', 'topicStats');
      unsubscribe = onSnapshot(topicStatsRef, (docSnap: any) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          // If Firestore returns { topicStats: {...} }, use topicStats, else use data directly
          // Use globalThis for test env check (JSDOM sets it)
          // @ts-expect-error: IS_REACT_ACT_ENVIRONMENT is set in test
          if (typeof globalThis !== 'undefined' && globalThis['IS_REACT_ACT_ENVIRONMENT']) {
            import('react').then(({ act }) => {
              act(() => {
                setLiveTopicStats(data.topicStats ? data.topicStats : data || {});
              });
            });
          } else {
            setLiveTopicStats(data.topicStats ? data.topicStats : data || {});
          }
        }
      });
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, [showResults]);

  // --- Quiz Progress Save/Load ---
  const saveQuizProgress = async (progress: any, merge: boolean = true) => {
    // Debug output for every call
    const statusMsg = `[E2E DEBUG] saveQuizProgress called: quizCompleted=${quizCompleted.current}, showResults=${showResults}, progressShowResults=${progress.showResults}, merge=${merge}, ts=${Date.now()}`;
    setFirestoreStatus(statusMsg);
    console.log(statusMsg);
    // Strict guard: after quiz is completed, only allow writes with showResults: true
    if (quizCompleted.current && progress.showResults !== true) {
      setFirestoreStatus('[E2E DEBUG] Blocked Firestore write after completion: only showResults:true allowed');
      console.log('[E2E DEBUG] Blocked Firestore write after completion: only showResults:true allowed', { ...progress, ts: Date.now() });
      return;
    }
    // Global guard: never allow a write with showResults: false if quiz is completed or showResults is true in state
    if (quizCompleted.current || showResults || progress.showResults === false) {
      if (progress.showResults === false) {
        // Failsafe: check Firestore before writing
        try {
          const auth = getAuth();
          const user = auth.currentUser;
          if (user) {
            const progressRef = doc(db, 'users', user.uid, 'quizProgress', 'current');
            const progressSnap = await getDoc(progressRef);
            if (progressSnap.exists() && progressSnap.data().showResults === true) {
              setFirestoreStatus('[E2E DEBUG] Blocked Firestore write with showResults: false because Firestore already has showResults: true');
              console.log('[E2E DEBUG] Blocked Firestore write with showResults: false because Firestore already has showResults: true', { ...progress, ts: Date.now() });
              return;
            }
          }
        } catch (err) {
          setFirestoreStatus('[E2E DEBUG] Error checking Firestore in saveQuizProgress failsafe: ' + String(err));
          console.error('[E2E DEBUG] Error checking Firestore in saveQuizProgress failsafe:', err);
        }
        setFirestoreStatus('[E2E DEBUG] Blocked Firestore write with showResults: false after completion or when showResults is true');
        console.log('[E2E DEBUG] Blocked Firestore write with showResults: false after completion or when showResults is true', { ...progress, ts: Date.now() });
        console.trace('[E2E DEBUG] Blocked Firestore write with showResults: false after completion or when showResults is true stack trace');
        return;
      }
    }
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const progressRef = doc(db, 'users', user.uid, 'quizProgress', 'current');
      const payload = { ...progress, lastWrite: Date.now() };
      setFirestoreStatus('[E2E DEBUG] Firestore write (saveQuizProgress) - attempting write');
      console.log('[E2E DEBUG] Firestore write (saveQuizProgress)', { ...payload, ts: Date.now(), merge });
      console.trace('[E2E DEBUG] Firestore write (saveQuizProgress) stack trace');
      try {
        await setDoc(progressRef, payload, { merge });
        setFirestoreStatus('[E2E DEBUG] Firestore write (saveQuizProgress) - SUCCESS');
      } catch (err) {
        setFirestoreStatus('[E2E DEBUG] Firestore write (saveQuizProgress) - ERROR: ' + String(err));
        console.error('[E2E DEBUG] Firestore write (saveQuizProgress) - ERROR:', err);
      }
    } else if (typeof window !== 'undefined') {
      window.localStorage.setItem('quizProgress', JSON.stringify({ ...progress, lastWrite: Date.now() }));
      setFirestoreStatus('[E2E DEBUG] Firestore write (saveQuizProgress) - localStorage fallback');
    }
  };

  // --- Debugging: Log all state changes ---
  useEffect(() => {
    console.log('Quiz state changed:', { started, showResults, current, userAnswers, shuffledQuestions, shuffledOptions });
  }, [started, showResults, current, userAnswers, shuffledQuestions, shuffledOptions]);

  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const forceShowStart = urlParams?.get('e2e') === '1';

  if (loading) {
    return (
      <div className="quiz-container" data-testid="quiz-container" role="form">
        <h1>Quiz</h1>
        <div style={{ color: '#2563eb', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center' }} data-testid="quiz-loading">
          <Spinner size={32} />
          Loading...
        </div>
      </div>
    );
  }

  // Compute answered array for QuizStepper
  // Defensive: ensure answeredArray is always correct for all questions
  const answeredArray = activeQuestions.map((_, i) => userAnswers[i] !== undefined);

  // Fix setFilter to accept string
  const handleSetFilter = (val: string) => setFilter(val as any);

  // Add a function to reset all quiz state and show the start form
  const resetQuiz = () => {
    setStarted(false);
    setShowResults(false);
    setCurrent(0);
    setUserAnswers([]);
    setShuffledQuestions([]);
    setShuffledOptions({});
    setFilter('all');
    setFilterValue('');
    setDesiredQuizLength(10);
    setLiveTopicStats(null);
    // Optionally reset selectedTopic, toggleState, etc. if needed
  };

  // --- Debugging: Log when Quiz component is mounted ---
  console.log('[E2E DEBUG] Quiz component mounted');

  // Add a global error handler for the quiz page (dev only)
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    window.addEventListener('error', (e) => {
      console.error('[E2E DEBUG] Global error:', e.error || e.message || e);
    });
    window.addEventListener('unhandledrejection', (e) => {
      console.error('[E2E DEBUG] Unhandled promise rejection:', e.reason || e);
    });
  }

  return (
    <div className="quiz-container" data-testid="quiz-container" role="form">
      <h1>Quiz</h1>
      {error && (
        <div role="alert" style={{ color: '#ef4444', fontWeight: 600, marginBottom: 12 }} data-testid="quiz-error">
          {error}
          <button
            onClick={() => setError(null)}
            style={{ marginLeft: 16, fontSize: 14, padding: '2px 10px', borderRadius: 6, border: 'none', background: '#fee2e2', color: '#b91c1c', cursor: 'pointer' }}
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      )}
      {warning && (
        <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: 12 }} data-testid="quiz-warning">
          {warning}
        </div>
      )}
      {/* Always render all quiz states inside the form container */}
      {(forceShowStart || (!started && !showResults)) && (
        <QuizStartForm
          availableTopics={sortedTopics}
          selectedTopic={selectedTopic}
          setSelectedTopic={setSelectedTopic}
          quizLength={quizLength}
          setQuizLength={val => setDesiredQuizLength(val === '' ? '' : Number(val))}
          maxQuizLength={maxQuizLength}
          sort={"default"}
          setSort={setSort}
          onStart={startQuiz}
          filter={filter}
          setFilter={handleSetFilter}
          filterValue={filterValue}
          setFilterValue={setFilterValue}
          toggleState={toggleState}
          setToggleState={setToggleState}
        />
      )}
      {started && !showResults && !forceShowStart && (
        <>
          <QuizProgressBar progress={progress} />
          <QuizTopicProgress topicStats={topicStats} />
          <QuizStepper
            total={totalQuestions}
            current={current}
            answered={answeredArray}
            onStep={setCurrent}
          />
          <QuizQuestionCard
            key={current}
            q={q}
            current={current}
            userAnswers={userAnswers}
            answered={userAnswers[current] !== undefined}
            answerFeedback={userAnswers[current] !== undefined ? ((shuffledOptions[current] || q.options)[userAnswers[current]] === q.correctAnswer ? 'Correct!' : 'Incorrect') : null}
            handleAnswer={handleAnswer}
            showExplanations={toggleState.showExplanations}
            shuffledOptions={shuffledOptions}
            isReviewMode={reviewMode}
            showInstantFeedback={toggleState.instantFeedback}
            onPrev={prev}
            onNext={() => {
              if (userAnswers[current] !== undefined && current < totalQuestions - 1) {
                setCurrent(current + 1);
              }
            }}
            onFinish={async () => {
              // Debug: log when finish is clicked and show answers
              console.log('Finish Quiz clicked', { userAnswers, current, totalQuestions });
              if (userAnswers.some((a, i) => a === undefined && i < totalQuestions)) {
                // Optionally, set a warning or flag for partial results
              }
              try {
                setStarted(false); // Ensure results page is shown (moved up)
                setShowResults(true); // Moved up
                quizCompleted.current = true; // Block further writes immediately (moved here)
                // Sanitize only for Firestore
                const sanitizedForFirestore = {
                  started: false,
                  current,
                  userAnswers: userAnswers.map(a => a === undefined ? null : a),
                  shuffledQuestions: (shuffledQuestions || []).map(q => q === undefined ? null : q),
                  shuffledOptions: Object.fromEntries(
                    Object.entries(shuffledOptions || {}).map(([k, v]) => [k, Array.isArray(v) ? v.map(opt => opt === undefined ? null : opt) : v])
                  ),
                  showResults: true
                };
                console.log('[E2E DEBUG] Firestore write (final)', { ...sanitizedForFirestore, ts: Date.now() });
                console.trace('[E2E DEBUG] Firestore write (final) stack trace');
                // --- Debugging: Extra logs around saveQuizProgress calls ---
                console.log('[E2E DEBUG] About to write showResults:true to Firestore (first call)');
                try {
                  await saveQuizProgress(sanitizedForFirestore, false); // merge: false for full overwrite
                  console.log('[E2E DEBUG] saveQuizProgress (first call) succeeded');
                } catch (err) {
                  console.error('[E2E DEBUG] saveQuizProgress (first call) ERROR:', err);
                }
                // Double-write failsafe
                console.log('[E2E DEBUG] About to write showResults:true to Firestore (second call)');
                try {
                  await saveQuizProgress(sanitizedForFirestore, false);
                  console.log('[E2E DEBUG] saveQuizProgress (second call) succeeded');
                } catch (err) {
                  console.error('[E2E DEBUG] saveQuizProgress (second call) ERROR:', err);
                }
                // Double-write failsafe
                console.log('[E2E DEBUG] About to write showResults:true to Firestore (third call)');
                try {
                  await saveQuizProgress(sanitizedForFirestore, false);
                  console.log('[E2E DEBUG] saveQuizProgress (third call) succeeded');
                } catch (err) {
                  console.error('[E2E DEBUG] saveQuizProgress (third call) ERROR:', err);
                }
                // Confirm Firestore state after write
                const auth = getAuth();
                const user = auth.currentUser;
                if (user) {
                  const progressRef = doc(db, 'users', user.uid, 'quizProgress', 'current');
                  const progressSnap = await getDoc(progressRef);
                  console.log('[E2E DEBUG] Firestore quizProgress after all writes:', progressSnap.exists() ? progressSnap.data() : null);
                  // Set firebaseUserUid in localStorage for E2E tests
                  if (typeof window !== 'undefined') {
                    window.localStorage.setItem('firebaseUserUid', user.uid);
                  }
                }
                await updateQuizStatsOnFinish({
                  userAnswers,
                  shuffledQuestions,
                  shuffledOptions,
                  started,
                  quizQuestions
                });
              } catch (err) {
                setError('Error: Failed to submit results. Could not submit your quiz results.');
                console.error('[E2E DEBUG] Error in onFinish:', err);
              }
            }}
            total={totalQuestions}
            disableAllOptions={quizQuestions.length === 0}
          />
        </>
      )}
      {showResults && !forceShowStart && (
        <QuizResultsScreen
          isAllIncorrect={false}
          onStartNewQuiz={resetQuiz}
          topicStats={liveTopicStats || topicStats}
          q={q}
          userAnswers={userAnswers}
          shuffledOptions={shuffledOptions}
          activeQuestions={activeQuestions}
        />
      )}
      {showResults && reviewMode && !forceShowStart && (
        <QuizReviewScreen
          reviewQueue={[]}
          activeQuestions={activeQuestions}
          userAnswers={userAnswers}
          shuffledOptions={shuffledOptions}
          toggleState={toggleState}
        />
      )}
      <div style={{position:'fixed',bottom:0,left:0,zIndex:9999,background:'#fffbe6',color:'#b45309',padding:'8px',fontSize:'12px',borderTopRightRadius:'8px',boxShadow:'0 0 4px #b45309',maxWidth:'60vw',wordBreak:'break-all'}} data-testid="e2e-debug-firestore-status">
        <div><b>E2E DEBUG</b></div>
        <div>showResults: {String(showResults)}</div>
        <div>Firestore: {firestoreStatus}</div>
        <div>UID: {firestoreUid}</div>
        <div>Doc Path: {firestoreDocPath}</div>
        <button onClick={fetchFirestoreDoc} style={{margin:'4px 0',fontSize:'11px'}}>Fetch Firestore Doc</button>
        <div>Doc: <pre style={{margin:0,whiteSpace:'pre-wrap'}}>{firestoreDoc ? JSON.stringify(firestoreDoc, null, 2) : 'null'}</pre></div>
      </div>
    </div>
  );
};

export default Quiz;
