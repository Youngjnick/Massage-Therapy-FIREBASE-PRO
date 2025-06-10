import React, { useEffect, useState, useRef } from 'react';
import { getQuestions } from '../questions/index';
import { Question } from '../types/index';
import { FaRegBookmark, FaBookmark, FaBookOpen, FaFlag } from 'react-icons/fa';
import { addBookmark, getBookmarks, deleteBookmark } from '../bookmarks/index';
import { logError, logFeedback } from '../errors/index';
import { db } from '../firebase/firebaseConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { getUserSettings } from '../userSettings/index';
import { getAuth } from 'firebase/auth';
import { recordUserInteraction } from '../stats/index';
import { getUserStats } from '../stats/index';
import { exportToCSV, exportToPDF } from '../utils/export';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { BASE_URL } from '../utils/baseUrl';

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
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [randomizeOptions, setRandomizeOptions] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<{ [key: number]: string[] }>({});
  const [showInstantFeedback, setShowInstantFeedback] = useState(true); // default on
  const [answerFeedback, setAnswerFeedback] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);
  const [questionStart, setQuestionStart] = useState<number | null>(null);
  const [showExplanations, setShowExplanations] = useState(true);
  const [filter, setFilter] = useState<'all' | 'incorrect' | 'unseen' | 'difficult' | 'tag' | 'slow'>('all');
  const [sort, setSort] = useState<'default' | 'accuracy' | 'time' | 'difficulty'>('default');
  const [userStats, setUserStats] = useState<any[]>([]);
  const [filterTag, setFilterTag] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [shake, setShake] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<number[]>([]);
  const [topicStats, setTopicStats] = useState<{[topic:string]:{correct:number,total:number}}>({});
  const { width, height } = useWindowSize();

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
    getBookmarks('demoUser').then((bm: any[]) => setBookmarks(bm.map((b: any) => b.questionId)));

    // Load user settings from Firestore on mount
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    getUserSettings(user.uid).then(settings => {
      setShowExplanations(settings.showExplanations !== false);
    });
  }, []);

  // Load user stats for filtering/sorting
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    getUserStats(user.uid).then(setUserStats);
  }, [started]);

  // Filter and slice questions for quiz
  const filteredQuestions = questions.filter((q: any) => (selectedTopic ? q.topic === selectedTopic : true));
  const getFilteredSortedQuestions = () => {
    let qs = [...filteredQuestions];
    if (filter === 'incorrect') {
      const incorrectIds = userStats.filter(s => s.interactionData && s.interactionData.answeredCorrectly === false).map(s => s.interactionData.questionId);
      qs = qs.filter(q => incorrectIds.includes(q.id));
    } else if (filter === 'unseen') {
      const seenIds = userStats.map(s => s.interactionData.questionId);
      qs = qs.filter(q => !seenIds.includes(q.id));
    } else if (filter === 'difficult') {
      qs = qs.filter(q => (q as any).difficulty === 'hard');
    } else if (filter === 'tag' && filterTag) {
      qs = qs.filter(q => (q.tags || []).includes(filterTag));
    } else if (filter === 'slow') {
      const slowIds = userStats.filter(s => s.interactionData && s.interactionData.timeSpent > 30).map(s => s.interactionData.questionId);
      qs = qs.filter(q => slowIds.includes(q.id));
    }
    if (sort === 'accuracy') {
      qs.sort((a, b) => {
        const aStats = userStats.filter(s => s.interactionData.questionId === a.id);
        const bStats = userStats.filter(s => s.interactionData.questionId === b.id);
        const aAcc = aStats.length ? aStats.filter(s => s.interactionData.answeredCorrectly).length / aStats.length : 0;
        const bAcc = bStats.length ? bStats.filter(s => s.interactionData.answeredCorrectly).length / bStats.length : 0;
        return aAcc - bAcc;
      });
    } else if (sort === 'time') {
      qs.sort((a, b) => {
        const aStats = userStats.filter(s => s.interactionData.questionId === a.id);
        const bStats = userStats.filter(s => s.interactionData.questionId === b.id);
        const aTime = aStats.length ? aStats.reduce((sum, s) => sum + (s.interactionData.timeSpent || 0), 0) / aStats.length : 0;
        const bTime = bStats.length ? bStats.reduce((sum, s) => sum + (s.interactionData.timeSpent || 0), 0) / bStats.length : 0;
        return bTime - aTime;
      });
    } else if (sort === 'difficulty') {
      qs.sort((a, b) => ((b as any).difficulty || '').localeCompare((a as any).difficulty || ''));
    }
    return qs;
  };
  const quizQuestions = getFilteredSortedQuestions();

  // Utility: Fisher-Yates shuffle
  function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Advanced adaptive difficulty: factor in speed, streak, and accuracy
  const getNextQuestionIndex = (wasCorrect: boolean) => {
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
    // 3. Accuracy: if accuracy < 60%, try easier; if >90%, try harder
    const answeredCount = userAnswers.filter(a => a !== undefined).length;
    const correctCount = userAnswers.filter((a, i) => a !== undefined && (shuffledOptions[i] || activeQuestions[i].options)[a] === activeQuestions[i].correctAnswer).length;
    const accuracy = answeredCount ? correctCount / answeredCount : 1;
    if (accuracy < 0.6 && targetIdx > 0) targetIdx--;
    if (accuracy > 0.9 && targetIdx < difficulties.length - 1) targetIdx++;
    // Clamp
    targetIdx = Math.max(0, Math.min(targetIdx, difficulties.length - 1));
    const targetDifficulty = difficulties[targetIdx];
    // Try to avoid repeating the same topic
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

  // Handle answer selection (with adaptive difficulty)
  const handleAnswer = (idx: number) => {
    if (answered) return;
    setUserAnswers((prev) => {
      const copy = [...prev];
      copy[current] = idx;
      return copy;
    });
    setAnswered(true);
    let wasCorrect = false;
    const correctOpt = (shuffledOptions[current] || q.options).indexOf(q.correctAnswer);
    if (showInstantFeedback) {
      if (idx === correctOpt) {
        setAnswerFeedback('Correct!');
        wasCorrect = true;
        if (streak + 1 >= 3) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 1800);
        }
      } else {
        setAnswerFeedback('Incorrect.');
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    }
    setTimeout(() => {
      setShowInstantFeedback(showInstantFeedback);
      setAnswered(false);
      setAnswerFeedback(null);
      if (showReview && reviewQueue.length > 0) {
        setCurrent(reviewQueue[0]);
        setReviewQueue(rq => rq.slice(1));
        if (reviewQueue.length === 1) setShowReview(false);
        return;
      }
      const nextIdx = getNextQuestionIndex(wasCorrect);
      if (nextIdx < activeQuestions.length) {
        setCurrent(nextIdx);
      } else {
        setShowResults(true);
      }
    }, showInstantFeedback ? 1200 : 0);
  };

  // Handle next/prev navigation
  const next = () => setCurrent((c) => Math.min(c + 1, quizQuestions.length - 1));
  const prev = () => setCurrent((c) => Math.max(c - 1, 0));

  // Handle quiz start/reset
  const startQuiz = () => {
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
    setUserAnswers([]);
    setShowResults(false);
  };
  const resetQuiz = () => {
    setStarted(false);
    setCurrent(0);
    setUserAnswers([]);
    setShowResults(false);
  };

  // Handle finish
  const finishQuiz = () => setShowResults(true);

  // Bookmark/unbookmark logic
  const toggleBookmark = (questionId: string) => {
    if (bookmarks.includes(questionId)) {
      deleteBookmark(questionId).then(() => setBookmarks(bm => bm.filter(id => id !== questionId)));
    } else {
      addBookmark('demoUser', { questionId }).then(() => setBookmarks(bm => [...bm, questionId]));
    }
  };

  // Feedback logic
  const handleFeedback = async () => {
    await logFeedback(feedback, 'demoUser');
    setFeedback('');
    setFeedbackSent(true);
    setTimeout(() => setFeedbackSent(false), 2000);
  };

  // Export handlers
  const handleExportBookmarks = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    const bookmarks = await getBookmarks(user.uid);
    exportToCSV('bookmarks.csv', bookmarks);
  };
  const handleExportStats = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    const stats = await getUserStats(user.uid);
    exportToCSV('review_history.csv', stats);
  };
  const handleExportBookmarksPDF = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    const bookmarks = await getBookmarks(user.uid);
    exportToPDF('bookmarks.pdf', bookmarks);
  };
  const handleExportStatsPDF = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    const stats = await getUserStats(user.uid);
    exportToPDF('review_history.pdf', stats);
  };

  // Quiz in progress
  const activeQuestions = started ? shuffledQuestions : quizQuestions;
  const q = activeQuestions[current];
  // Accessibility: Keyboard navigation and focus
  const optionRefs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => {
    if (started && optionRefs.current[userAnswers[current] ?? 0]) {
      optionRefs.current[userAnswers[current] ?? 0]?.focus();
    }
  }, [current, started]);
  useEffect(() => {
    if (!started) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prev();
      } else if (/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (q.options[idx]) handleAnswer(idx);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [current, started, q]);

  // Reset feedback and answered state on question change or quiz start
  useEffect(() => {
    setAnswerFeedback(null);
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
    // eslint-disable-next-line
  }, [answered]);

  const handleReportError = (questionId: string) => {
    const msg = prompt('Describe the error for this question:');
    if (msg) logError(`[QuestionID: ${questionId}] ${msg}`, 'demoUser');
  };

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

  // Adaptive topic mix: increase frequency of weak topics
  const getWeakTopics = () => {
    return Object.entries(topicStats)
      .filter(([t, stat]) => stat.total >= 2 && (stat.correct / stat.total) < 0.7)
      .map(([t]) => t);
  };

  // In getNextQuestionIndex, after advanced logic, before fallback:
  const weakTopics = getWeakTopics();
  for (let i = current + 1; i < activeQuestions.length; i++) {
    if (activeQuestions[i].topic && weakTopics.includes(activeQuestions[i].topic as string) && userAnswers[i] === undefined) {
      return i;
    }
  }

  if (loading) return <div>Loading questions...</div>;
  if (error) return <div>{error}</div>;

  if (!started) {
    return (
      <div className="glass-card" style={{ maxWidth: 600, margin: '2rem auto' }}>
        <h2>Start a Quiz</h2>
        <form style={{ marginBottom: '1rem' }} onSubmit={e => { e.preventDefault(); startQuiz(); }}>
          <label>
            Topic:
            <select value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)}>
              {availableTopics.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </label>
          <label style={{ marginLeft: '1rem' }}>
            Quiz Length:
            <input
              type="number"
              min={1}
              max={filteredQuestions.length}
              value={quizLength}
              onChange={e => setQuizLength(Number(e.target.value))}
              style={{ width: 60, marginLeft: 4 }}
            />
          </label>
          <label style={{ marginLeft: '1rem' }}>
            <input type="checkbox" checked={randomizeQuestions} onChange={e => setRandomizeQuestions(e.target.checked)} /> Randomize Questions
          </label>
          <label style={{ marginLeft: '1rem' }}>
            <input type="checkbox" checked={randomizeOptions} onChange={e => setRandomizeOptions(e.target.checked)} /> Randomize Options
          </label>
          <label style={{ marginLeft: '1rem' }}>
            <input type="checkbox" checked={showInstantFeedback} onChange={e => setShowInstantFeedback(e.target.checked)} /> Instant Feedback
          </label>
          <label style={{ marginLeft: '1rem' }}>
            Filter:
            <select value={filter} onChange={e => setFilter(e.target.value as any)}>
              <option value="all">All</option>
              <option value="incorrect">Incorrect</option>
              <option value="unseen">Unseen</option>
              <option value="difficult">Difficult</option>
              <option value="tag">By Tag</option>
              <option value="slow">Slow (time &gt; 30s)</option>
            </select>
            {filter === 'tag' && (
              <input type="text" value={filterTag} onChange={e => setFilterTag(e.target.value)} placeholder="Tag..." style={{ marginLeft: 4, width: 80 }} />
            )}
          </label>
          <label style={{ marginLeft: '1rem' }}>
            Sort:
            <select value={sort} onChange={e => setSort(e.target.value as any)}>
              <option value="default">Default</option>
              <option value="accuracy">By Accuracy</option>
              <option value="time">By Time</option>
              <option value="difficulty">By Difficulty</option>
            </select>
          </label>
          <button type="submit" style={{ marginLeft: '1rem' }}>Start Quiz</button>
        </form>
      </div>
    );
  }

  if (showResults) {
    // Calculate score
    let correct = 0;
    let streak = 0;
    let maxStreak = 0;
    let lastCorrect = false;
    // Record review history for each question
    useEffect(() => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;
      activeQuestions.forEach((q, i) => {
        const isCorrect = userAnswers[i] !== undefined && (shuffledOptions[i] || q.options)[userAnswers[i]] === q.correctAnswer;
        const stat = {
          userId: user.uid,
          questionId: q.id,
          answeredCorrectly: isCorrect,
          timeSpent: questionTimes[i] || null,
          streak: streak,
          timestamp: new Date(),
          tags: q.tags || [],
          difficulty: (q as any).difficulty || null,
        };
        recordUserInteraction(user.uid, stat);
        if (isCorrect) {
          correct++;
          streak = lastCorrect ? streak + 1 : 1;
          lastCorrect = true;
          if (streak > maxStreak) maxStreak = streak;
        } else {
          lastCorrect = false;
          streak = 0;
        }
      });
      // Only run once per quiz result
      // eslint-disable-next-line
    }, [showResults]);
    const avgTime = questionTimes.length ? (questionTimes.reduce((a, b) => a + b, 0) / questionTimes.length).toFixed(2) : 'N/A';
    return (
      <div className="glass-card" style={{ maxWidth: 700, margin: '2rem auto' }}>
        <h2>Quiz Results</h2>
        <p>Your score: {correct} / {activeQuestions.length}</p>
        <div style={{ margin: '16px 0' }}>
          <strong>Average Time per Question:</strong> {avgTime} sec<br />
          <strong>Longest Correct Streak:</strong> {maxStreak}
        </div>
        <div style={{ margin: '16px 0' }}>
          <strong>Accuracy by Topic:</strong>
          <ul>
            {Object.entries(topicStats).map(([topic, stat]) => (
              <li key={topic}>{topic}: {stat.correct} / {stat.total} ({((stat.correct / stat.total) * 100).toFixed(0)}%)</li>
            ))}
          </ul>
        </div>
        <button onClick={resetQuiz}>Try Another Quiz</button>
        <ul style={{ marginTop: 24 }}>
          {activeQuestions.map((q: any, i) => (
            <li key={q.id} style={{ marginBottom: 16 }}>
              <strong>{q.text}</strong><br />
              <span>Your answer: {userAnswers[i] !== undefined ? (shuffledOptions[i] || q.options)[userAnswers[i]] : 'No answer'}</span><br />
              <span>Correct answer: {q.correctAnswer}</span>
              {q.short_explanation && (
                <div style={{ color: '#059669', marginTop: 4 }}>Explanation: {q.short_explanation}</div>
              )}
              {q.long_explanation && (
                <div style={{ color: '#2563eb', marginTop: 4 }}>More Info: {q.long_explanation}</div>
              )}
              {q.clinical_application && (
                <div style={{ color: '#64748b', marginTop: 4 }}>Clinical Application: {q.clinical_application}</div>
              )}
              <div style={{ color: '#64748b', fontSize: 13 }}>Time: {questionTimes[i] ? questionTimes[i].toFixed(2) : 'N/A'} sec</div>
              <button onClick={() => toggleBookmark(q.id)} style={{ marginLeft: 8 }}>
                {bookmarks.includes(q.id) ? <FaBookmark color="#f59e42" /> : <FaRegBookmark />}
              </button>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 32 }}>
          <button onClick={() => setShowBookmarks(b => !b)}>
            {showBookmarks ? 'Hide' : 'Show'} Bookmarked Questions
          </button>
          {showBookmarks && (
            <ul style={{ marginTop: 16 }}>
              {quizQuestions.filter(q => bookmarks.includes(q.id)).map(q => (
                <li key={q.id}>
                  <strong>{q.text}</strong>
                  <button onClick={() => toggleBookmark(q.id)} style={{ marginLeft: 8 }}>
                    <FaBookmark color="#f59e42" /> Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div style={{ marginTop: 32 }}>
          <h3>Feedback</h3>
          <textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Your feedback..." style={{ width: '100%', minHeight: 60 }} />
          <button onClick={handleFeedback} disabled={!feedback}>Send Feedback</button>
          {feedbackSent && <span style={{ color: '#059669', marginLeft: 8 }}>Thank you!</span>}
        </div>
        {/* Export buttons */}
        <div style={{ marginTop: 24, display: 'flex', gap: 16 }}>
          <button onClick={handleExportBookmarks}>Export Bookmarks (CSV)</button>
          <button onClick={handleExportStats}>Export Review History (CSV)</button>
          <button onClick={handleExportBookmarksPDF}>Export Bookmarks (PDF)</button>
          <button onClick={handleExportStatsPDF}>Export Review History (PDF)</button>
        </div>
      </div>
    );
  }

  // Quiz in progress
  const progress = activeQuestions.length > 0 ? ((current + 1) / activeQuestions.length) * 100 : 0;
  // Calculate streak and accuracy
  let streak = 0;
  for (let i = current; i >= 0; i--) {
    if (userAnswers[i] !== undefined) {
      const correctOpt = (shuffledOptions[i] || activeQuestions[i].options).indexOf(activeQuestions[i].correctAnswer);
      if (userAnswers[i] === correctOpt) streak++;
      else break;
    }
  }
  const answeredCount = userAnswers.filter(a => a !== undefined).length;
  const correctCount = userAnswers.filter((a, i) => a !== undefined && (shuffledOptions[i] || activeQuestions[i].options)[a] === activeQuestions[i].correctAnswer).length;
  const accuracy = answeredCount ? (correctCount / answeredCount) : 1;

  return (
    <div className="quiz-card">
      {/* Bookmarks icon in top right */}
      <button
        onClick={() => setShowBookmarks(b => !b)}
        style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', zIndex: 10 }}
        title={showBookmarks ? 'Hide Bookmarked Questions' : 'Show Bookmarked Questions'}
      >
        <FaBookOpen size={28} color={showBookmarks ? '#3b82f6' : '#64748b'} />
      </button>
      <h2 style={{ marginBottom: 8 }}>Quiz: {selectedTopic}</h2>
      {/* Editable bookmarks list modal/panel */}
      {showBookmarks && (
        <div style={{ position: 'absolute', top: 56, right: 16, background: 'rgba(255,255,255,0.95)', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.12)', padding: 20, minWidth: 320, zIndex: 20 }}>
          <h3 style={{ marginTop: 0 }}>Bookmarked Questions</h3>
          {bookmarks.length === 0 ? (
            <div style={{ color: '#64748b' }}>No bookmarks yet.</div>
          ) : (
            <ul style={{ maxHeight: 300, overflowY: 'auto', padding: 0, margin: 0, listStyle: 'none' }}>
              {quizQuestions.filter(q => bookmarks.includes(q.id)).map(q => (
                <li key={q.id} style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}>
                  <span style={{ flex: 1 }}>{q.text}</span>
                  <button onClick={() => toggleBookmark(q.id)} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
                    <FaBookmark color="#f59e42" /> Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />}
      {/* Topic Progress Bars */}
      {topicStats && Object.entries(topicStats).length > 0 && (
        <div style={{display:'flex',gap:16,marginBottom:12,flexWrap:'wrap'}}>
          {Object.entries(topicStats).map(([topic,stat]) => (
            <div key={topic} style={{minWidth:120}}>
              <div style={{fontWeight:600}}>{topic}</div>
              <div style={{height:8,background:'#e5e7eb',borderRadius:4,margin:'4px 0',position:'relative'}}>
                <div style={{width:`${stat.total?((stat.correct/stat.total)*100):0}%`,height:'100%',background:'#3b82f6',borderRadius:4,transition:'width 0.3s'}} />
              </div>
              <div style={{fontSize:12}}>{stat.correct} / {stat.total} correct</div>
            </div>
          ))}
        </div>
      )}
      {/* Shake animation on question card */}
      <div className={shake ? 'shake' : ''}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current}
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -60, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            <div>
              <strong>Question {current + 1} of {activeQuestions.length}</strong>
              <div style={{ margin: '1rem 0', fontSize: 20 }}>{q.text}</div>
              {q.img && (
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <img
                    src={q.img.startsWith('http') ? q.img : `${BASE_URL}${q.img}`}
                    alt="Question Illustration"
                    style={{ maxWidth: 320, maxHeight: 200, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}
                  />
                </div>
              )}
              {q.media && (
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <video controls style={{ maxWidth: 320, borderRadius: 12 }}>
                    <source src={q.media.startsWith('http') ? q.media : `${BASE_URL}${q.media}`} />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}
              {q.audio && (
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <audio controls style={{ maxWidth: 320 }}>
                    <source src={q.audio.startsWith('http') ? q.audio : `${BASE_URL}${q.audio}`} />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
              {/* Progress Dots/Stepper */}
              <div className="quiz-stepper" aria-label="Question Progress" role="group">
                {activeQuestions.map((_, idx) => (
                  <button
                    key={idx}
                    className={
                      'quiz-stepper-dot' +
                      (idx === current ? ' active' : '') +
                      (userAnswers[idx] !== undefined ? ' answered' : '')
                    }
                    aria-label={`Go to question ${idx + 1}`}
                    onClick={() => setCurrent(idx)}
                  />
                ))}
              </div>
              <ul className="quiz-options">
                {(shuffledOptions[current] || q.options).map((opt: string, i: number) => {
                  const correctOpt = (shuffledOptions[current] || q.options).indexOf(q.correctAnswer);
                  let optionClass = 'quiz-option';
                  if (answered) {
                    if (i === correctOpt) optionClass += ' correct';
                    else if (userAnswers[current] === i) optionClass += ' incorrect';
                  } else if (userAnswers[current] === i) {
                    optionClass += ' selected';
                  }
                  return (
                    <li key={i}>
                      <label className={optionClass} style={{ width: '100%' }}>
                        <input
                          ref={(el) => { optionRefs.current[i] = el || null; }}
                          type="radio"
                          name={`q${current}`}
                          checked={userAnswers[current] === i}
                          onChange={() => handleAnswer(i)}
                          aria-label={`Option ${String.fromCharCode(65 + i)}: ${opt}`}
                          style={{ marginRight: 12 }}
                          disabled={answered}
                        />
                        <span style={{ fontWeight: 600, marginRight: 8 }}>{String.fromCharCode(65 + i)}.</span> {opt}
                        <button type="button" onClick={e => { e.stopPropagation(); toggleBookmark(q.id); }} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer' }} aria-label={bookmarks.includes(q.id) ? 'Remove flag for review' : 'Flag for review'}>
                          {bookmarks.includes(q.id) ? <FaBookmark color="#f59e42" /> : <FaRegBookmark />}
                        </button>
                        <button type="button" onClick={e => { e.stopPropagation(); handleReportError(q.id); }} style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Report Error">
                          <FaFlag color="#ef4444" />
                        </button>
                      </label>
                    </li>
                  );
                })}
              </ul>
              {showInstantFeedback && answerFeedback && (
                <div className="quiz-feedback" style={{ color: answerFeedback === 'Correct!' ? '#059669' : '#ef4444' }}>{answerFeedback}</div>
              )}
              {showExplanations && (
                <>
                  {q.short_explanation && (
                    <div className="quiz-explanation">Quick Tip: {q.short_explanation}</div>
                  )}
                  {q.long_explanation && (
                    <div style={{ color: '#2563eb', marginTop: 8, fontSize: 15 }}>More Info: {q.long_explanation}</div>
                  )}
                  {q.clinical_application && (
                    <div style={{ color: '#64748b', marginTop: 8, fontSize: 14 }}>Clinical Application: {q.clinical_application}</div>
                  )}
                </>
              )}
              {q.source_reference && (
                <div style={{ color: '#a16207', marginTop: 8, fontSize: 13 }}>Source: {q.source_reference}</div>
              )}
              {(q.tags || q.keywords) && (
                <div style={{ color: '#64748b', marginTop: 8, fontSize: 13 }}>
                  {q.tags && q.tags.length > 0 && (
                    <span>Tags: {q.tags.join(', ')} </span>
                  )}
                  {q.keywords && q.keywords.length > 0 && (
                    <span>Keywords: {q.keywords.join(', ')}</span>
                  )}
                </div>
              )}
              <div className="quiz-actions">
                <button onClick={prev} disabled={current === 0}>Previous</button>
                {current < activeQuestions.length - 1 ? (
                  <button onClick={next} disabled={!answered}>Next</button>
                ) : (
                  <button onClick={finishQuiz} disabled={!answered}>Finish</button>
                )}
                <button onClick={resetQuiz}>Cancel</button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Progress Bar */}
      <div className="quiz-progress-bar">
        <div className="quiz-progress-bar-inner" style={{ width: `${progress}%` }} />
      </div>
      {/* Session summary modal placeholder */}
      {showResults && (
        <div className="modal-summary">
          <div>
            <h3>Session Summary</h3>
            {/* TODO: Add charts for accuracy by topic, time per question, streaks, suggested focus */}
            <div>Charts and insights coming soon!</div>
            <button onClick={() => setShowResults(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;

/* CSS for shake animation and modal-summary
.shake {
  animation: shake 0.5s;
}
@keyframes shake {
  0% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-8px); }
  80% { transform: translateX(8px); }
  100% { transform: translateX(0); }
}
.modal-summary {
  position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-summary > div { background: #fff; border-radius: 16px; padding: 32px; min-width: 320px; }
*/
