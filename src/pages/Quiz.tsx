// NOTE: Always ensure that `started` and `showResults` are mutually exclusive (never true at the same time) to prevent quiz card and results/review from rendering together.

import React, { useEffect, useState } from 'react';
import { getQuestions } from '../questions/index';
import { getBookmarks } from '../bookmarks/index';
import { getAuth } from 'firebase/auth';
import QuizQuestionCard from '../components/Quiz/QuizQuestionCard';
import QuizProgressBar from '../components/Quiz/QuizProgressBar';
import QuizStepper from '../components/Quiz/QuizStepper';
import QuizStartForm from '../components/Quiz/QuizStartForm';
import { useQuizToggles } from '../hooks/useQuizToggles';
import { useQuizState } from '../hooks/useQuizState';
import { getFilteredSortedQuestions } from '../utils/quizFiltering';
import { db } from '../firebaseClient';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import QuizResultsScreen from '../components/Quiz/QuizResultsScreen';
import QuizReviewScreen from '../components/Quiz/QuizReviewScreen';
import QuizTopicProgress from '../components/Quiz/QuizTopicProgress';
import { useQuizData } from '../hooks/useQuizData';
import { updateQuizStatsOnFinish, updateQuizStatsOnAnswer } from '../services/quizStatsService';

// Get initial toggle state from localStorage if available
let initialToggleState = undefined;
if (typeof window !== 'undefined') {
  try {
    const stored = window.localStorage.getItem('quizToggleState');
    if (stored) initialToggleState = JSON.parse(stored);
  } catch { /* ignore localStorage errors */ }
}
const Quiz: React.FC = () => {
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
  const availableTopics = Array.from(new Set(questions.map((q: any) => q.topic || 'Other')));
  const maxQuizLength = quizQuestions.length;
  // User can select a desired quiz length, but always clamp to available range
  const [desiredQuizLength, setDesiredQuizLength] = useState<number>(10);
  const quizLength = maxQuizLength === 0 ? 0 : Math.max(1, Math.min(desiredQuizLength, maxQuizLength));
  const totalQuestions = started ? shuffledQuestions.length : quizQuestions.length;
  const progress = totalQuestions > 0 ? Math.round((userAnswers.filter((a) => a !== undefined).length / totalQuestions) * 100) : 0;

  // --- All hooks must be called unconditionally at the top level ---
  // Load questions and bookmarks on component mount
  useEffect(() => {
    getQuestions()
      .then((qs) => {
        setQuestions(qs);
        // Extract unique topics
        const topics = Array.from(new Set(qs.map((q: any) => q.topic || 'Other')));
        if (!selectedTopic && topics.length > 0) setSelectedTopic(topics[0]);
      })
      .catch(() => console.log('Failed to load questions'))
      .finally(() => setLoading(false));

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
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        // Do NOT submit answer, just go to next/prev question
        e.preventDefault();
        // Do not call setAnswered(false) here, just navigate
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next();
        else prev();
        return;
      }
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
    if (showResults) return; // Ignore answers after quiz is completed
    const newAnswers = [...userAnswers];
    newAnswers[current] = idx;
    setUserAnswers(newAnswers);
    // After updating local state, update Firestore stats with the new answers
    await updateQuizStatsOnAnswer({
      userAnswers: newAnswers,
      shuffledQuestions,
      shuffledOptions,
      started,
      quizQuestions
    });
  };

  // --- Firestore analytics update at quiz finish ---
  useEffect(() => {
    if (!showResults) return;
    updateQuizStatsOnFinish({
      userAnswers,
      shuffledQuestions,
      shuffledOptions,
      started,
      quizQuestions
    });
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
      const topic = q.topic || 'Other';
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
            const topic = q.topic || 'Other';
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

  if (loading) return null;

  // Compute answered array for QuizStepper
  const answeredArray = activeQuestions.map((_, i) => userAnswers[i] !== undefined);

  // Fix setFilter and setSort to accept string
  const handleSetFilter = (val: string) => setFilter(val as any);
  const handleSetSort = (val: string) => setSort(val);

  return (
    <div className="quiz-container">
      {started && !showResults && (
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
              // Only advance if answered
              if (userAnswers[current] !== undefined && current < totalQuestions - 1) {
                setCurrent(current + 1);
              }
            }}
            onFinish={() => {
              // Show results with whatever questions have been answered so far
              setShowResults(true);
            }}
            total={totalQuestions}
          />
        </>
      )}
      {!started && !showResults && (
        <QuizStartForm
          availableTopics={availableTopics}
          selectedTopic={selectedTopic}
          setSelectedTopic={setSelectedTopic}
          quizLength={quizLength}
          setQuizLength={setDesiredQuizLength}
          maxQuizLength={maxQuizLength}
          sort={"default"}
          setSort={handleSetSort}
          onStart={startQuiz}
          filter={filter}
          setFilter={handleSetFilter}
          filterValue={filterValue}
          setFilterValue={setFilterValue}
          toggleState={toggleState}
          setToggleState={setToggleState}
        />
      )}
      {showResults && (
        <QuizResultsScreen
          isAllIncorrect={false}
          onStartNewQuiz={startQuiz}
          topicStats={liveTopicStats || topicStats}
          q={q}
          userAnswers={userAnswers}
          shuffledOptions={shuffledOptions}
          activeQuestions={activeQuestions}
        />
      )}
      {showResults && reviewMode && (
        <QuizReviewScreen
          reviewQueue={[]}
          activeQuestions={activeQuestions}
          userAnswers={userAnswers}
          shuffledOptions={shuffledOptions}
          toggleState={toggleState}
        />
      )}
    </div>
  );
};

export default Quiz;
