// NOTE: Always ensure that `started` and `showResults` are mutually exclusive (never true at the same time) to prevent quiz card and results/review from rendering together.

import React, { useEffect, useState } from 'react';
import { getQuestions } from '../questions/index';
import { Question } from '../types/index';
import { getBookmarks } from '../bookmarks/index';
import { getAuth } from 'firebase/auth';
import QuizQuestionCard from '../components/Quiz/QuizQuestionCard';
import QuizProgressBar from '../components/Quiz/QuizProgressBar';
import QuizStepper from '../components/Quiz/QuizStepper';
import QuizStartForm from '../components/Quiz/QuizStartForm';
import { useQuizToggles } from '../hooks/useQuizToggles';
import { useQuizState } from '../hooks/useQuizState';
import { getFilteredSortedQuestions } from '../utils/quizFiltering';
import { getNextQuestionIndex } from '../utils/quizAdaptive';
import { getQuizFeedback } from '../utils/quizFeedback';

// Get initial toggle state from localStorage if available
let initialToggleState = undefined;
if (typeof window !== 'undefined') {
  try {
    const stored = window.localStorage.getItem('quizToggleState');
    if (stored) initialToggleState = JSON.parse(stored);
  } catch { /* ignore localStorage errors */ }
}
const Quiz: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [quizLength, setQuizLength] = useState<number>(questions.length > 0 ? questions.length : 10);
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
    answered,
    setAnswered,
    questionTimes,
    setQuestionTimes,
    questionStart,
    setQuestionStart,
    hasCompletedQuiz,
    setHasCompletedQuiz,
    filter,
    setFilter,
    filterValue,
    setFilterValue,
    sort,
    setSort,
  } = useQuizState();

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
  const availableDifficulties = Array.from(new Set(questions.map((q: any) => q.difficulty).filter(Boolean)));
  const handleSetFilter = (val: string) => setFilter(val as any);
  const totalQuestions = started ? shuffledQuestions.length : quizQuestions.length;
  const progress = totalQuestions > 0 ? Math.round((userAnswers.filter((a) => a !== undefined).length / totalQuestions) * 100) : 0;
  const answeredArr = (started ? shuffledQuestions : quizQuestions).map((_, i) => userAnswers[i] !== undefined);

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

  // Reset feedback and answered state on question change or quiz start
  useEffect(() => {
    setAnswered(false);
  }, [current, started]);

  // Reset answered state when current question changes
  useEffect(() => {
    setAnswered(false);
  }, [current]);

  // Start timing when quiz starts or question changes
  useEffect(() => {
    if (started) {
      setQuestionStart(Date.now());
    }
  }, [current, started]);
  // On answer, record time spent
  useEffect(() => {
    if (answered && questionStart !== null) {
      setQuestionTimes((prev) => {
        const copy = [...prev];
        copy[current] = (Date.now() - questionStart) / 1000;
        return copy;
      });
    }
  }, [answered]);

  // When quiz is finished, set hasCompletedQuiz to true
  useEffect(() => {
    if (showResults) setHasCompletedQuiz(true);
  }, [showResults]);

  // --- Adaptive/advanced logic helpers ---
  // Removed unused getWeakTopics function

  const startQuiz = () => {
    setStarted(true);
    setLoading(true);
    setCurrent(0);
    setUserAnswers(Array(quizLength).fill(undefined));
    setQuestionTimes(Array(quizLength).fill(0));
    setShowResults(false);
    setAnswered(false); // <-- ensure reset here
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

  // Remove unused parameter 'submit' from handleAnswer
  const handleAnswer = (idx: number) => {
    if (answered) return;
    setUserAnswers((prev) => {
      const copy = [...prev];
      copy[current] = idx;
      return copy;
    });
    setAnswered(true);
    // For demo: auto-move to next question after 1s
    setTimeout(() => {
      if (showResults) {
        next();
      } else {
        const nextIdx = getNextQuestionIndex(activeQuestions, current, userAnswers, shuffledOptions, questionTimes);
        setCurrent(nextIdx);
      }
    }, 1000);
  };

  // When quiz is finished, set hasCompletedQuiz to true
  useEffect(() => {
    if (showResults) setHasCompletedQuiz(true);
  }, [showResults]);

  // Automatically update quizLength to match available questions for selected topic
  useEffect(() => {
    if (!selectedTopic) return;
    const count = questions.filter(q => q.topic === selectedTopic).length;
    setQuizLength(count);
  }, [selectedTopic, questions]);

  // --- Render ---
  return (
    <div className="quiz-container">
      <h1>Quiz</h1>
      {/* Always render the start form, even while loading, with toggles and disabled Start button */}
      {!started && !showResults && (
        <QuizStartForm
          availableTopics={loading ? [] : availableTopics}
          selectedTopic={selectedTopic}
          setSelectedTopic={setSelectedTopic}
          quizLength={quizLength}
          setQuizLength={setQuizLength}
          maxQuizLength={loading ? 0 : questions.length}
          sort={sort}
          setSort={setSort}
          onStart={({ selectedTopic, quizLength }) => {
            setSelectedTopic(selectedTopic);
            setQuizLength(quizLength);
            setHasCompletedQuiz(false); // Hide Start New Quiz button until quiz is finished again
            startQuiz();
          }}
          filter={filter}
          setFilter={handleSetFilter}
          filterValue={filterValue}
          setFilterValue={setFilterValue}
          availableDifficulties={loading ? [] : availableDifficulties}
          availableTags={loading ? [] : Array.from(new Set(questions.flatMap(q => q.tags || [])))}
          toggleState={toggleState}
          setToggleState={setToggleState}
          showStartNewQuiz={hasCompletedQuiz}
          onStartNewQuiz={() => {
            setStarted(false);
            setShowResults(false);
            setCurrent(0);
            setUserAnswers([]);
            setQuestionTimes([]);
            setSelectedTopic('');
            setQuizLength(questions.length > 0 ? questions.length : 10);
            setHasCompletedQuiz(true); // Always keep the button visible after a quiz session
          }}
        />
      )}
      {/* Only show quiz card if started and not loading */}
      {started && !loading ? (
        <>
          <QuizProgressBar progress={progress} />
          <QuizStepper
            total={totalQuestions}
            current={current}
            answered={answeredArr}
            onStep={setCurrent}
          />
          <div className="quiz-question">
            {q && (
              <QuizQuestionCard
                q={q}
                current={current}
                userAnswers={userAnswers}
                answered={answered}
                handleAnswer={handleAnswer}
                answerFeedback={getQuizFeedback(q, current, userAnswers, shuffledOptions)}
                showExplanations={toggleState.showExplanations}
                shuffledOptions={shuffledOptions}
                isReviewMode={false}
                showInstantFeedback={toggleState.instantFeedback}
              />
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Quiz;
