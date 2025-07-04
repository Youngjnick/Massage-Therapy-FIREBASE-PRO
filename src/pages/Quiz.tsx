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
import QuizResultsScreen from '../components/Quiz/QuizResultsScreen';
import Spinner from '../components/common/Spinner';
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

  // --- All hooks must be called unconditionally at the top level ---
  // Load questions and bookmarks on component mount
  useEffect(() => {
    getQuestions()
      .then((qs) => {
        setQuestions(qs);
        const topics = Array.from(new Set(qs.map((q: any) => (q.topics && q.topics[q.topics.length - 1]) || 'Other')));
        const sorted = [...topics].sort((a, b) => a.localeCompare(b));
        setSortedTopics(sorted);
        if (!selectedTopic && sorted.length > 0) setSelectedTopic(sorted[0]);
      })
      .finally(() => {
        setLoading(false);
      });
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
    qs = qs.slice(0, maxQuizLength);
    setShuffledQuestions(qs);
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

  // Check for navigation intent from Analytics
  useEffect(() => {
    if (location.state && location.state.startMissedUnanswered && location.state.topic) {
      // Set selected topic immediately
      setSelectedTopic(location.state.topic);
      // Wait for questions to load, then trigger missed/unanswered quiz
      if (!loading && questions.length > 0) {
        handleStartMissedUnansweredQuiz(location.state.topic);
        // Optionally clear the state so it doesn't re-trigger on refresh
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, loading, questions]);

  // Use quizQuestions.length as the max quiz length
  const maxQuizLength = quizQuestions.length;

  // Render quiz UI components based on the current state
  if (loading) return <Spinner />;
  if (showResults) {
    return (
      <QuizResultsScreen
        topicStats={{}}
        onStartNewQuiz={() => {
          setShowResults(false);
          setStarted(false);
          setCurrent(0);
          setUserAnswers(Array(maxQuizLength).fill(undefined));
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
          onFinish={() => setShowResults(true)}
          total={totalQuestions}
          answered={userAnswers[current] !== undefined}
        />
      </div>
    );
  }
  // Quiz start form
  return (
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
  );
};

export default Quiz;
