import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { getQuestions } from '../questions/index';
import { Question } from '../types/index';
import { getBookmarks } from '../bookmarks/index';
import { getAuth } from 'firebase/auth';
import QuizStartForm from '../components/Quiz/QuizStartForm';
import QuizQuestionCard from '../components/Quiz/QuizQuestionCard';
import QuizProgressBar from '../components/Quiz/QuizProgressBar';
import QuizStepper from '../components/Quiz/QuizStepper';
import { shuffleArray } from '../utils/quizUtils';

const Quiz: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [quizLength, setQuizLength] = useState<number>(10);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [randomizeQuestions, setRandomizeQuestions] = useState(true); // default true
  const [randomizeOptions, setRandomizeOptions] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<{ [key: number]: string[] }>({});
  const [showInstantFeedback, setShowInstantFeedback] = useState(true);
  const [answered, setAnswered] = useState(false);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);
  const [questionStart, setQuestionStart] = useState<number | null>(null);
  const [sort, setSort] = useState<'default' | 'accuracy' | 'time' | 'difficulty'>('default');
  const [showReview, setShowReview] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<number[]>([]);
  const [topicStats, setTopicStats] = useState<{[topic:string]:{correct:number,total:number}}>({});
  const [showExplanations, setShowExplanations] = useState(true); // default true
  const [filter, setFilter] = useState<'all' | 'incorrect' | 'unseen' | 'difficulty' | 'tag'>('all');
  const [filterValue, setFilterValue] = useState<string>('');
  const optionRefs = useRef<(HTMLInputElement | null)[]>([]);

  // --- Derived variables (declare before hooks) ---
  const filteredQuestions = questions.filter((q: any) => (selectedTopic ? q.topic === selectedTopic : true));

  // Reset filter and filterValue on quiz start
  useEffect(() => {
    if (!started) {
      setFilter('all');
      setFilterValue('');
    }
  }, [started]);

  const getFilteredSortedQuestions = () => {
    let qs = [...filteredQuestions];
    // --- Filtering ---
    if (filter === 'incorrect') {
      qs = qs.filter((q, i) => userAnswers[i] !== undefined && (shuffledOptions[i] || q.options)[userAnswers[i]] !== q.correctAnswer);
    } else if (filter === 'unseen') {
      qs = qs.filter((q, i) => userAnswers[i] === undefined);
    } else if (filter === 'difficulty' && filterValue) {
      qs = qs.filter(q => q.difficulty === filterValue);
    } else if (filter === 'tag' && filterValue) {
      qs = qs.filter(q => q.tags && q.tags.includes(filterValue));
    }
    // --- Sorting ---
    if (sort === 'accuracy') {
      // If you have per-question accuracy stats, sort by them. Placeholder: no-op.
    } else if (sort === 'time') {
      // If you have per-question time stats, sort by them. Placeholder: no-op.
    } else if (sort === 'difficulty') {
      const order: Record<string, number> = { easy: 0, medium: 1, intermediate: 2, hard: 3 };
      qs.sort((a, b) => (order[a.difficulty ?? ''] ?? 99) - (order[b.difficulty ?? ''] ?? 99));
    }
    return qs;
  };
  const quizQuestions = getFilteredSortedQuestions();
  const activeQuestions = started ? shuffledQuestions : quizQuestions;
  const q = activeQuestions[current];

  // Ensure optionRefs has the correct length for the current question
  useEffect(() => {
    if (!q) return;
    const optionCount = (shuffledOptions[current] || q.options).length;
    optionRefs.current = Array(optionCount)
      .fill(null)
      .map((_, i) => optionRefs.current[i] || null);
  }, [q, current, shuffledOptions]);

  // Focus the first option's input after quiz start or question change
  useLayoutEffect(() => {
    if (started && optionRefs.current[0]) {
      optionRefs.current[0].focus();
    }
  }, [started, current, shuffledOptions]);

  // After quiz start, move focus to the first radio input for accessibility
  useEffect(() => {
    if (started && optionRefs.current[0]) {
      setTimeout(() => {
        optionRefs.current[0]?.focus();
      }, 0);
    }
  }, [started]);

  // --- All hooks must be called unconditionally at the top level ---
  // Load questions and bookmarks on component mount
  useEffect(() => {
    getQuestions()
      .then((qs) => {
        setQuestions(qs);
        // Extract unique topics
        const topics = Array.from(new Set(qs.map((q: any) => q.topic || 'Other')));
        setAvailableTopics(topics);
        if (!selectedTopic && topics.length > 0) setSelectedTopic(topics[0]);
      })
      .catch(() => setError('Failed to load questions'))
      .finally(() => setLoading(false));

    // Load bookmarks from Firebase on start (replace 'userId' with real user id)
    getBookmarks('demoUser');

    // Load user settings from Firestore on mount
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    // getUserSettings(user.uid).then(settings => {
    //   setShowExplanations(settings.showExplanations !== false);
    // });
  }, []);

  // Load user stats for filtering/sorting
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    // getUserStats(user.uid).then(setUserStats);
  }, [started]);

  // Accessibility: Keyboard navigation and focus
  useEffect(() => {
    if (started && optionRefs.current[userAnswers[current] ?? 0]) {
      optionRefs.current[userAnswers[current] ?? 0]?.focus();
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
        if (q && q.options[idx]) handleAnswer(idx, false);
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

  // Track per-topic stats for progress bars and weakness targeting
  useEffect(() => {
    const stats: {[topic:string]:{correct:number,total:number}} = {};
    activeQuestions.forEach((q, i) => {
      const topic = q.topic || 'Other';
      if (!stats[topic]) stats[topic] = {correct:0,total:0};
      if (userAnswers[i] !== undefined) {
        stats[topic].total++;
        const correctOpt = (shuffledOptions[i] || q.options).indexOf(q.correctAnswer);
        if (userAnswers[i] === correctOpt) stats[topic].correct++;
      }
    });
    setTopicStats(stats);
  }, [userAnswers, shuffledOptions]);

  // Micro-review: if 3 wrong in a row, show review mode
  useEffect(() => {
    let wrongStreak = 0;
    for (let i = userAnswers.length - 1; i >= 0; i--) {
      if (userAnswers[i] !== undefined) {
        const correctOpt = (shuffledOptions[i] || activeQuestions[i].options).indexOf(activeQuestions[i].correctAnswer);
        if (userAnswers[i] !== correctOpt) wrongStreak++;
        else break;
      }
    }
    if (wrongStreak >= 3 && !showReview) {
      // Queue up last 3 wrong questions for review
      const review = [];
      for (let i = userAnswers.length - 1; i >= 0 && review.length < 3; i--) {
        if (userAnswers[i] !== undefined) {
          const correctOpt = (shuffledOptions[i] || activeQuestions[i].options).indexOf(activeQuestions[i].correctAnswer);
          if (userAnswers[i] !== correctOpt) review.push(i);
        }
      }
      setReviewQueue(review.reverse());
      setShowReview(true);
    }
  }, [userAnswers]);

  // Spaced repetition: re-queue missed questions at end
  useEffect(() => {
    if (showResults && activeQuestions.length > 0) {
      const missed = activeQuestions.map((q, i) => i).filter(i => {
        const correctOpt = (shuffledOptions[i] || activeQuestions[i].options).indexOf(activeQuestions[i].correctAnswer);
        return userAnswers[i] !== correctOpt;
      });
      if (missed.length > 0) setReviewQueue(missed);
    }
  }, [showResults]);

  // --- Adaptive/advanced logic helpers ---
  function getWeakTopics() {
    return Object.entries(topicStats)
      .filter(([, stat]) => stat.total >= 2 && (stat.correct / stat.total) < 0.7)
      .map(([t]) => t);
  }
  const getNextQuestionIndex = () => {
    if (!activeQuestions[current]?.difficulty) return current + 1;
    const currentDifficulty = activeQuestions[current].difficulty;
    const allDifficulties = Array.from(new Set(activeQuestions.map(q => q.difficulty).filter(Boolean)));
    const difficulties = ['easy', 'medium', 'intermediate', 'hard'].filter(d => allDifficulties.includes(d));
    let idx = difficulties.indexOf(currentDifficulty);
    if (idx === -1) return current + 1;
    let targetIdx = idx;
    // --- Advanced logic ---
    // 1. Speed: if user was fast (<15s), try harder; if slow (>30s), try easier
    const lastTime = questionTimes[current] || 0;
    if (lastTime < 15 && idx < difficulties.length - 1) targetIdx++;
    if (lastTime > 30 && idx > 0) targetIdx--;
    // 2. Streak: if on a correct streak >=3, try harder
    let streak = 0;
    for (let i = current; i >= 0; i--) {
      if (userAnswers[i] !== undefined) {
        const correctOpt = (shuffledOptions[i] || activeQuestions[i].options).indexOf(activeQuestions[i].correctAnswer);
        if (userAnswers[i] === correctOpt) streak++;
        else break;
      }
    }
    if (streak >= 3 && targetIdx < difficulties.length - 1) targetIdx++;
    // Clamp
    targetIdx = Math.max(0, Math.min(targetIdx, difficulties.length - 1));
    const targetDifficulty = difficulties[targetIdx];
    const currentTopic = activeQuestions[current].topic;
    // 1. Find next unanswered question of targetDifficulty and different topic
    for (let i = current + 1; i < activeQuestions.length; i++) {
      if (
        activeQuestions[i].difficulty === targetDifficulty &&
        userAnswers[i] === undefined &&
        activeQuestions[i].topic !== currentTopic
      ) {
        return i;
      }
    }
    // 2. Next unanswered question of targetDifficulty (any topic)
    for (let i = current + 1; i < activeQuestions.length; i++) {
      if (activeQuestions[i].difficulty === targetDifficulty && userAnswers[i] === undefined) {
        return i;
      }
    }
    // Adaptive topic mix: increase frequency of weak topics
    const weakTopics = getWeakTopics();
    for (let i = current + 1; i < activeQuestions.length; i++) {
      if (activeQuestions[i].topic && weakTopics.includes(activeQuestions[i].topic as string) && userAnswers[i] === undefined) {
        return i;
      }
    }
    // Fallback: closest available difficulty
    let searchOrder = [];
    for (let offset = 1; offset < difficulties.length; offset++) {
      if (targetIdx + offset < difficulties.length) searchOrder.push(difficulties[targetIdx + offset]);
      if (targetIdx - offset >= 0) searchOrder.push(difficulties[targetIdx - offset]);
    }
    for (const diff of searchOrder) {
      for (let i = current + 1; i < activeQuestions.length; i++) {
        if (activeQuestions[i].difficulty === diff && userAnswers[i] === undefined) {
          return i;
        }
      }
    }
    for (let i = current + 1; i < activeQuestions.length; i++) {
      if (userAnswers[i] === undefined) return i;
    }
    // No more questions
    return activeQuestions.length;
  };
  const next = () => setCurrent((c) => Math.min(c + 1, quizQuestions.length - 1));
  const prev = () => setCurrent((c) => Math.max(c - 1, 0));
  const handleAnswer = (idx: number, submit: boolean = false) => {
    if (answered && submit) return;
    setUserAnswers((prev) => {
      const copy = [...prev];
      copy[current] = idx;
      return copy;
    });
    if (submit) {
      setAnswered(true);
      setTimeout(() => {
        setShowInstantFeedback(showInstantFeedback);
        setAnswered(false);
        if (showReview && reviewQueue.length > 0) {
          setCurrent(reviewQueue[0]);
          setReviewQueue(rq => rq.slice(1));
          if (reviewQueue.length === 1) setShowReview(false);
          return;
        }
        const nextIdx = getNextQuestionIndex();
        if (nextIdx < activeQuestions.length) {
          setCurrent(nextIdx);
        } else {
          setShowResults(true);
        }
      }, showInstantFeedback ? 500 : 0);
    }
  };
  function startQuiz() {
    let qs = quizQuestions;
    if (randomizeQuestions) {
      qs = shuffleArray(qs);
    }
    setShuffledQuestions(qs);
    // Shuffle options for each question if enabled
    if (randomizeOptions) {
      const opts: { [key: number]: string[] } = {};
      qs.forEach((q, idx) => {
        opts[idx] = shuffleArray(q.options);
      });
      setShuffledOptions(opts);
    } else {
      setShuffledOptions({});
    }
    setStarted(true);
    setCurrent(0);
    // Ensure first radio is selected by default for accessibility/tab order
    setUserAnswers([0]);
    setShowResults(false);
    // Programmatically focus the first radio input after quiz starts
    setTimeout(() => {
      if (optionRefs.current[0]) optionRefs.current[0].focus();
    }, 0);
  }

  // --- Render loading/error state, or quiz/success content ---
  if (loading) return <div>Loading questions...</div>;
  if (error) return <div>{error}</div>;

  // Quiz start screen
  if (!started) {
    // Collect all unique tags from questions
    const allTags = Array.from(new Set(questions.flatMap(q => q.tags || [])));
    const allDifficulties = Array.from(new Set(questions.map(q => q.difficulty).filter(Boolean))) as string[];
    return (
      <div className="glass-card" style={{ maxWidth: 600, margin: '2rem auto' }}>
        <h2>Start a Quiz</h2>
        <QuizStartForm
          availableTopics={availableTopics}
          selectedTopic={selectedTopic}
          setSelectedTopic={setSelectedTopic}
          quizLength={quizLength}
          setQuizLength={setQuizLength}
          maxQuizLength={filteredQuestions.length}
          randomizeQuestions={randomizeQuestions}
          setRandomizeQuestions={setRandomizeQuestions}
          randomizeOptions={randomizeOptions}
          setRandomizeOptions={setRandomizeOptions}
          sort={sort}
          setSort={val => setSort(val as typeof sort)}
          onStart={startQuiz}
          showExplanations={showExplanations}
          setShowExplanations={setShowExplanations}
          filter={filter}
          setFilter={val => setFilter(val as typeof filter)}
          filterValue={filterValue}
          setFilterValue={setFilterValue}
          availableDifficulties={allDifficulties}
          availableTags={allTags}
          showInstantFeedback={showInstantFeedback}
          setShowInstantFeedback={setShowInstantFeedback}
        />
      </div>
    );
  }

  // Results screen (simple inline summary)
  if (showResults) {
    const correctCount = userAnswers.filter((a, i) => a !== undefined && (shuffledOptions[i] || activeQuestions[i].options)[a] === activeQuestions[i].correctAnswer).length;
    return (
      <div style={{ maxWidth: 600, margin: '2rem auto', textAlign: 'center' }}>
        <h2>Quiz Results</h2>
        <div style={{ fontSize: 20, margin: '1rem 0' }}>Score: {correctCount} / {activeQuestions.length}</div>
        <div style={{ margin: '1rem 0' }}>Average Time: {questionTimes.length ? (questionTimes.reduce((a, b) => a + b, 0) / questionTimes.length).toFixed(2) : 'N/A'} seconds</div>
        <button onClick={() => {
          setStarted(false);
          setShowResults(false);
          setUserAnswers([]);
          setCurrent(0);
          setAnswered(false);
          setShuffledQuestions([]);
          setShuffledOptions({});
          setReviewQueue([]);
          setShowReview(false);
          setQuestionTimes([]);
          setQuestionStart(null);
        }}>Start New Quiz</button>
      </div>
    );
  }

  // Quiz in progress
  return (
    <div>
      <QuizProgressBar progress={activeQuestions.length > 0 ? ((current + 1) / activeQuestions.length) * 100 : 0} />
      <QuizStepper
        total={activeQuestions.length}
        current={current}
        answered={activeQuestions.map((_, i) => userAnswers[i] !== undefined)}
        onStep={setCurrent}
      />
      <QuizQuestionCard
        q={q}
        current={current}
        userAnswers={userAnswers}
        answered={answered}
        handleAnswer={handleAnswer}
        optionRefs={optionRefs}
        showInstantFeedback={showInstantFeedback}
        answerFeedback={null}
        showExplanations={showExplanations}
        shuffledOptions={shuffledOptions}
      />
    </div>
  );
}

export default Quiz;
