import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { getQuestions } from '../questions/index';
import { Question } from '../types/index';
import { getBookmarks } from '../bookmarks/index';
import { logFeedback } from '../errors/index';
import { getAuth } from 'firebase/auth';
import QuizStartForm from '../components/Quiz/QuizStartForm';
import { useWindowSize } from 'react-use';
import QuizQuestionCard from '../components/Quiz/QuizQuestionCard';

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
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [randomizeOptions, setRandomizeOptions] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<{ [key: number]: string[] }>({});
  const [showInstantFeedback, setShowInstantFeedback] = useState(true);
  const [answered, setAnswered] = useState(false);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);
  const [questionStart, setQuestionStart] = useState<number | null>(null);
  const [sort, setSort] = useState<'default' | 'accuracy' | 'time' | 'difficulty'>('default');
  // const [userStats, setUserStats] = useState<any[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<number[]>([]);
  const [topicStats, setTopicStats] = useState<{[topic:string]:{correct:number,total:number}}>({});
  useWindowSize();

  // --- Derived variables (declare before hooks) ---
  const filteredQuestions = questions.filter((q: any) => (selectedTopic ? q.topic === selectedTopic : true));
  const getFilteredSortedQuestions = () => {
    let qs = [...filteredQuestions];
    return qs;
  };
  const quizQuestions = getFilteredSortedQuestions();
  const activeQuestions = started ? shuffledQuestions : quizQuestions;
  const q = activeQuestions[current];
  const optionRefs = useRef<(HTMLInputElement | null)[]>([]);

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
      // Only handle Arrow keys for question navigation if NOT focused on a radio input
      const active = document.activeElement;
      if (active && active.tagName === 'INPUT' && (active as HTMLInputElement).type === 'radio') {
        // Let browser handle radio navigation
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prev();
      } else if (/^[1-9]$/.test(e.key)) {
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

  // --- Handler and utility function definitions (must be before any return/guard clause) ---
  // Utility: Fisher-Yates shuffle
  function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Adaptive topic mix: increase frequency of weak topics
  function getWeakTopics() {
    return Object.entries(topicStats)
      .filter(([, stat]) => stat.total >= 2 && (stat.correct / stat.total) < 0.7)
      .map(([t]) => t);
  }

  function getNextQuestionIndex() {
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
  // New: distinguish between navigation and answer submission
  const handleAnswer = (idx: number, submit: boolean = false) => {
    if (answered) return; // Prevent rapid/duplicate answers
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

  // Handler to start the quiz
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

  return (
    <div>
      {/* --- Quiz start / topic selection --- */}
      {!started && (
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
            setSort={(val: string) => setSort(val as any)}
            onStart={startQuiz}
          />
        </div>
      )}

      {/* --- Actual quiz --- */}
      {started && (
        <div>
          <QuizQuestionCard
            q={q}
            current={current}
            userAnswers={userAnswers}
            answered={answered}
            handleAnswer={handleAnswer}
            optionRefs={optionRefs}
            showExplanations={false}
            shuffledOptions={shuffledOptions}
          />
        </div>
      )}

      {/* --- Results and review --- */}
      {showResults && (
        <div data-testid="quiz-results-screen">
          <h2>Results</h2>
          <div>
            {activeQuestions.map((q, i) => {
              const userAnswer = userAnswers[i];
              const correctOpt = (shuffledOptions[i] || q.options).indexOf(q.correctAnswer);
              const isCorrect = userAnswer === correctOpt;
              return (
                <div key={i} style={{ marginBottom: '1rem' }}>
                  <div>
                    <strong>Q{i + 1}:</strong> {q.text}
                  </div>
                  <div>
                    Your answer: {userAnswer !== undefined ? (shuffledOptions[i] || q.options)[userAnswer] : '—'}
                    {isCorrect ? ' ✅' : ' ❌'}
                  </div>
                  <div>
                    Correct answer: {q.correctAnswer}
                  </div>
                </div>
              );
            })}
          </div>
          <h3>Topic Stats</h3>
          <ul>
            {Object.entries(topicStats).map(([topic, stats]) => (
              <li key={topic}>
                {topic}: {stats.correct} / {stats.total} correct
              </li>
            ))}
          </ul>
          <button onClick={() => {
            console.log('Start New Quiz button clicked');
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
          }} aria-label="Start New Quiz">
            Start New Quiz
          </button>
        </div>
      )}
    </div>
  );
};

export default Quiz;
