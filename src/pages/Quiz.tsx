// NOTE: Always ensure that `started` and `showResults` are mutually exclusive (never true at the same time) to prevent quiz card and results/review from rendering together.

import React, { useEffect, useState } from 'react';
// --- Error Boundary for Quiz Page ---
class QuizErrorBoundary extends React.Component<any, { error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { error };
  }
  componentDidCatch(error: any, info: any) {
    if (typeof window !== 'undefined') {
      window.__LAST_ERROR__ = { error: error?.toString?.() || error, info };
    }
    // eslint-disable-next-line no-console
    console.error('[QUIZ ERROR BOUNDARY]', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div data-testid="quiz-error" style={{ color: 'red', padding: 24, background: '#fff0f0', border: '1px solid #f00' }}>
          <h2>Quiz Page Error</h2>
          <pre>{this.state.error?.toString?.() || String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// Global error logging for E2E/debug
if (typeof window !== 'undefined') {
  window.onerror = function (msg, url, line, col, error) {
    window.__LAST_ERROR__ = { msg, url, line, col, error: error?.toString?.() || error };
    // eslint-disable-next-line no-console
    console.error('[QUIZ GLOBAL ERROR]', msg, url, line, col, error);
  };
  window.onunhandledrejection = function (event) {
    window.__LAST_ERROR__ = { reason: event.reason?.toString?.() || event.reason };
    // eslint-disable-next-line no-console
    console.error('[QUIZ GLOBAL UNHANDLED REJECTION]', event.reason);
  };
}
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
import QuizResultsScreen from '../components/Quiz/QuizResultsScreen';
import Spinner from '../components/common/Spinner';
import { useTopicStats } from '../hooks/useTopicStats';
import { useQuizData } from '../hooks/useQuizData';
import { useLocation } from 'react-router-dom';

// Get initial toggle state from localStorage if available
let initialToggleState = undefined;
if (typeof window !== 'undefined') {
  try {
    const stored = window.localStorage.getItem('quizToggleState');
    if (stored) initialToggleState = JSON.parse(stored);
  } catch { /* ignore localStorage errors */ }
}
const Quiz: React.FC = () => {
  const location = useLocation();
  // --- All hooks must be called unconditionally at the top level ---
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
  } = useQuizState();
  const [reviewMode] = useState(false);

  // Local state for sortedTopics and desiredQuizLength
  const [sortedTopics, setSortedTopics] = useState<string[]>([]);
  const [desiredQuizLength, setDesiredQuizLength] = useState<number | ''>(5);

  // Use modularized data hook
  const { questions, setQuestions, loading, setLoading } = useQuizData(selectedTopic, setSelectedTopic);

  // --- Handlers for navigation and answering ---
  const next = () => setCurrent((c) => Math.min(c + 1, (started ? shuffledQuestions.length : quizQuestions.length) - 1));
  const prev = () => setCurrent((c) => Math.max(c - 1, 0));
  const handleAnswer = (idx: number) => {
    const updated = [...userAnswers];
    updated[current] = idx;
    setUserAnswers(updated);
  };

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
  const totalQuestions = started ? shuffledQuestions.length : quizQuestions.length;
  const progress = totalQuestions > 0 ? Math.round((userAnswers.filter((a) => a !== undefined).length / totalQuestions) * 100) : 0;

  // --- FIX: Always call useTopicStats at the top level to avoid Hooks violation ---
  const topicStats = useTopicStats(activeQuestions, userAnswers, shuffledOptions);

  // --- All hooks must be called unconditionally at the top level ---
  // Load questions and bookmarks on component mount
  useEffect(() => {
    getQuestions()
      .then((qs) => {
        setQuestions(qs);
        // DEBUG: Log all loaded questions and their topics
        if (typeof window !== 'undefined') {
          // @ts-ignore
          window.__ALL_QUIZ_QUESTIONS__ = qs;
        }
        console.log('[QUIZ DEBUG] Loaded questions:', qs);
        console.log('[QUIZ DEBUG] Extracted topics:', qs.map(q => q.topics));
        const topics = Array.from(new Set(qs.map((q: any) => (q.topics && q.topics[q.topics.length - 1]) || 'Other')));
        const sorted = [...topics].sort((a, b) => a.localeCompare(b));
        setSortedTopics(sorted);
        // Removed setSelectedTopic from here to avoid infinite loop
      })
      .finally(() => {
        setLoading(false);
      });
  // Set selectedTopic to first available topic if not set, after sortedTopics is updated
  // (MUST be inside the Quiz function component)
  useEffect(() => {
    if (!selectedTopic && sortedTopics.length > 0) {
      setSelectedTopic(sortedTopics[0]);
    }
  }, [selectedTopic, sortedTopics]);
    getBookmarks('demoUser');
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
  }, []);

  // Accessibility: Keyboard navigation and focus
  useEffect(() => {
    if (started && q) {
      const idx = userAnswers[current] ?? 0;
      const option = document.querySelector(`input[type="radio"][name="question-${current}-option-${idx}"]`);
      if (option && 'focus' in option && typeof (option as HTMLElement).focus === 'function') {
        (option as HTMLElement).focus();
      }
    }
    if (!started) return;
    const handleKey = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (active && (active as HTMLElement).hasAttribute && (active as HTMLElement).hasAttribute('data-quiz-radio')) {
        return;
      }
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        if (e.key === 'ArrowRight') next();
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

  // --- Quiz Start Logic ---
  const startQuiz = () => {
    setStarted(true);
    setLoading(true);
    setCurrent(0);
    setUserAnswers(Array(maxQuizLength).fill(undefined));
    setShowResults(false);
    let qs = [...quizQuestions];
    if (toggleState.randomizeQuestions) {
      for (let i = qs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [qs[i], qs[j]] = [qs[j], qs[i]];
      }
    }
    // Always slice to maxQuizLength (from desiredQuizLength)
    qs = qs.slice(0, maxQuizLength);
    setShuffledQuestions(qs);
    // Expose the real quiz length for E2E/debug
    if (typeof window !== 'undefined') {
      window.__QUIZ_LENGTH__ = qs.length;
      console.log('[QUIZ DEBUG] __QUIZ_LENGTH__ set to', qs.length);
    }
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

  // --- Missed/Unanswered Quiz Start Logic ---
  const handleStartMissedUnansweredQuiz = (topic: string) => {
    // Find missed/unanswered questions for the topic
    const missed = questions.filter(
      (q: any, i: number) =>
        Array.isArray(q.topics) && q.topics.includes(topic) &&
        (userAnswers[i] === undefined || (shuffledOptions[i] || q.options)[userAnswers[i]] !== q.correctAnswer)
    );
    if (missed.length > 0) {
      setStarted(true);
      setShowResults(false);
      setCurrent(0);
      setUserAnswers(Array(missed.length).fill(undefined));
      setShuffledQuestions(missed);
      // Shuffle options for each question
      const so: { [key: number]: string[] } = {};
      missed.forEach((q, i) => {
        so[i] = [...(q.options || [])];
        if (toggleState.randomizeOptions) {
          for (let j = so[i].length - 1; j > 0; j--) {
            const k = Math.floor(Math.random() * (j + 1));
            [so[i][j], so[i][k]] = [so[i][k], so[i][j]];
          }
        }
      });
      setShuffledOptions(so);
    }
  };

  // Check for navigation intent from Analytics (guard against infinite loop)
  const hasStartedMissedQuizRef = React.useRef(false);
  useEffect(() => {
    if (
      location.state &&
      location.state.startMissedUnanswered &&
      location.state.topic &&
      !hasStartedMissedQuizRef.current
    ) {
      // Only set selected topic if different
      setSelectedTopic((prev) => {
        if (prev !== location.state.topic) {
          return location.state.topic;
        }
        return prev;
      });
      // Wait for questions to load, then trigger missed/unanswered quiz
      if (!loading && questions.length > 0) {
        handleStartMissedUnansweredQuiz(location.state.topic);
        hasStartedMissedQuizRef.current = true;
        // Optionally clear the state so it doesn't re-trigger on refresh
        window.history.replaceState({}, document.title);
      }
    }
    // Reset ref if location changes to a different topic
    if (
      !location.state ||
      !location.state.startMissedUnanswered ||
      !location.state.topic
    ) {
      hasStartedMissedQuizRef.current = false;
    }
  }, [location.state, loading, questions]);

  // Use quizQuestions.length as the max quiz length
  // Use desiredQuizLength (user input) as the max quiz length, fallback to quizQuestions.length
  const maxQuizLength = typeof desiredQuizLength === 'number' && desiredQuizLength > 0 ? desiredQuizLength : quizQuestions.length;

  // --- DEBUG: Log state on every render ---
  useEffect(() => {
    console.log('[QUIZ DEBUG] Render: started', started, 'showResults', showResults, 'current', current, 'userAnswers', userAnswers, 'activeQuestions', activeQuestions);
  }, [started, showResults, current, userAnswers, activeQuestions]);

  // --- DEBUG: Log when showResults changes ---
  useEffect(() => {
    console.log('[QUIZ DEBUG] showResults changed:', showResults);
  }, [showResults]);

  // Render quiz UI components based on the current state
  if (loading) return <Spinner />;
  if (showResults) {
    // Expose quiz result object for E2E/debug
    if (typeof window !== 'undefined') {
      window.__LAST_QUIZ_RESULT__ = {
        userAnswers,
        activeQuestions,
        shuffledOptions,
        topicStats,
      };
      if (!topicStats || Object.keys(topicStats).length === 0) {
        console.warn('[QUIZ DEBUG] Results screen: topicStats is empty or missing!', { topicStats, userAnswers, activeQuestions, shuffledOptions });
      }
      if (!window.__LAST_QUIZ_RESULT__) {
        console.error('[QUIZ DEBUG] Results screen: __LAST_QUIZ_RESULT__ is not set!');
      } else {
        console.log('[QUIZ DEBUG] Results screen rendered. __LAST_QUIZ_RESULT__:', window.__LAST_QUIZ_RESULT__);
      }
    }
    console.log('[QUIZ DEBUG] Rendering QuizResultsScreen', { topicStats, userAnswers, activeQuestions, shuffledOptions });
    return (
      <QuizResultsScreen
        topicStats={topicStats}
        onStartNewQuiz={() => {
          console.log('[QUIZ DEBUG] onStartNewQuiz called, resetting state');
          setShowResults(false);
          setStarted(false);
          setCurrent(0);
          setUserAnswers(Array(maxQuizLength).fill(undefined));
          setShuffledQuestions([]);
          setShuffledOptions({});
          setQuestions([]); // Force questions to reload
        }}
        isAllIncorrect={false}
        q={q}
        userAnswers={userAnswers}
        shuffledOptions={shuffledOptions}
        activeQuestions={activeQuestions}
        onStartMissedUnansweredQuiz={handleStartMissedUnansweredQuiz}
      />
    );
  }
  const handleFinish = React.useCallback((source: 'cancel' | 'final') => {
    let updatedAnswers = [...userAnswers];
    // Only allow partial quiz completion if source is 'cancel' (mid-quiz Finish button)
    const isCancel = source === 'cancel';
    if (!isCancel) {
      // For Finish Quiz (final question), require answer
      if (updatedAnswers[current] === undefined) {
        console.warn('[QUIZ DEBUG] Tried to finish quiz but current question is unanswered. Aborting.');
        return;
      }
    }
    // Mark all unanswered as undefined (should not be needed, but keep for robustness)
    for (let i = 0; i < totalQuestions; i++) {
      if (updatedAnswers[i] === undefined) {
        updatedAnswers[i] = undefined;
      }
    }
    setUserAnswers(updatedAnswers);
    // Use a microtask to ensure state updates before showing results
    Promise.resolve().then(() => {
      console.log(`[QUIZ DEBUG] onFinish called from ${source}, setting showResults to true. userAnswers:`, updatedAnswers);
      if (current === totalQuestions - 1) {
        console.log('[QUIZ DEBUG] handleFinish: This was the last question. Should show results next.');
      } else {
        console.log('[QUIZ DEBUG] handleFinish: Not last question. current:', current, 'totalQuestions:', totalQuestions);
      }
      setShowResults(true);
    });
  }, [userAnswers, current, totalQuestions, setUserAnswers, setShowResults, activeQuestions]);

  if (started && q) {
    return (
      <div>
        <QuizProgressBar progress={progress} />
        <QuizStepper
          current={current}
          total={totalQuestions}
          answered={userAnswers.map(a => a !== undefined)}
          onStep={setCurrent}
        />
        <QuizQuestionCard
          q={q}
          current={current}
          userAnswers={userAnswers}
          handleAnswer={handleAnswer}
          answerFeedback={null}
          showExplanations={toggleState.showExplanations}
          shuffledOptions={shuffledOptions}
          isReviewMode={reviewMode}
          showInstantFeedback={toggleState.instantFeedback}
          onPrev={prev}
          onNext={next}
          onFinish={handleFinish}
          total={totalQuestions}
          answered={userAnswers[current] !== undefined}
        />
      </div>
    );
  }
  // Quiz start form
  return (
    <QuizErrorBoundary>
      <QuizStartForm
        availableTopics={sortedTopics}
        selectedTopic={selectedTopic}
        setSelectedTopic={setSelectedTopic}
        quizLength={desiredQuizLength}
        setQuizLength={setDesiredQuizLength as any}
        maxQuizLength={maxQuizLength}
        sort={''}
        setSort={() => {}}
        onStart={startQuiz}
        filter={filter}
        setFilter={val => setFilter(val as any)}
        filterValue={filterValue}
        setFilterValue={setFilterValue}
        toggleState={toggleState}
        setToggleState={setToggleState}
      />
    </QuizErrorBoundary>
  );
};

export default Quiz;
