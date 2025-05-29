import React, { useState, useRef, useEffect } from "react";
import { useBookmarks } from "./BookmarkContext.jsx";
import { useAnalytics } from "./AnalyticsContext.jsx";
import { useBadges } from "./BadgeContext.jsx";

/**
 * QuizCard - React version of the quiz card/question/answer area.
 * Props:
 *   questions: array - all questions
 *   selectedTopic: string - topic to filter
 *   quizLength: string|number - number of questions (or 'all')
 */
export default function QuizCard({ questions, selectedTopic, quizLength, onToggleBookmarks, onRestartQuiz, onStatsUpdate, onQuestionAnswered }) {
  // Always call hooks first
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState("");
  const quizCardRef = useRef(null);
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const { updateAnalytics } = useAnalytics();
  const { earnBadge } = useBadges();

  // Defensive: handle missing questions prop
  const hasQuestions = !!questions && Array.isArray(questions);
  const filtered = hasQuestions && selectedTopic ? questions.filter(q => q.topic === selectedTopic) : (hasQuestions ? questions : []);
  const quizPool = quizLength === "all" ? filtered : filtered.slice(0, Number(quizLength) || 0);
  const currentQ = quizPool && quizPool.length > 0 && current < quizPool.length ? quizPool[current] : null;
  const bookmarked = currentQ ? isBookmarked(currentQ.id) : false;

  useEffect(() => {
    if (quizCardRef.current) quizCardRef.current.focus();
  }, [current]);

  useEffect(() => {
    updateAnalytics({
      correct,
      streak,
      total: quizPool.length,
      completed: current >= quizPool.length ? 1 : 0
    });
  }, [current, correct, streak, quizPool.length]);

  // Debug: log questions array length
  console.log("[QuizCard] questions prop length:", questions ? questions.length : 0);

  if (!hasQuestions || questions.length === 0) {
    return <div className="quiz-card visible no-questions" role="region" aria-label="Quiz Area" data-testid="quiz-card-empty">Failed to load questions</div>;
  }
  if (!quizPool.length) {
    return <div className="quiz-card visible no-questions" role="region" aria-label="Quiz Area" data-testid="quiz-card-no-topic">No questions available for the selected topic/length.</div>;
  }
  if (current >= quizPool.length) {
    return (
      <div className="quiz-card visible" role="region" aria-label="Quiz Area" data-testid="quiz-card-complete">
        Quiz complete! Score: {correct}/{quizPool.length}
        <br />
        <button
          className="start-btn"
          style={{ marginTop: 16, padding: '8px 20px', fontSize: 18, borderRadius: 8, background: '#222', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px #0003' }}
          onClick={() => typeof onRestartQuiz === 'function' && onRestartQuiz()}
          data-testid="restart-quiz-btn"
        >
          Start New Quiz
        </button>
      </div>
    );
  }
  if (!currentQ) {
    return (
      <div className="quiz-card visible no-questions" role="region" aria-label="Quiz Area" data-testid="quiz-card-error">
        Question data is missing or invalid.
      </div>
    );
  }
  function handleAnswer(idx) {
    if (showFeedback) return;
    setSelected(idx);
    setShowFeedback(true);
    const isCorrect = currentQ.correct === idx;
    setFeedback(isCorrect ? "Correct!" : "Incorrect.");
    // Notify parent of answered question
    if (typeof onQuestionAnswered === 'function') {
      onQuestionAnswered(currentQ.id, idx);
    }
    setCorrect(c => {
      const newCorrect = isCorrect ? c + 1 : c;
      if (isCorrect && newCorrect === 10) {
        earnBadge("10 Correct Answers!");
      }
      return newCorrect;
    });
    setStreak(s => isCorrect ? s + 1 : 0);
    setTimeout(() => {
      setCurrent(c => c + 1);
      setSelected(null);
      setShowFeedback(false);
      setFeedback("");
      // Firestore stats sync after each answer
      if (typeof onStatsUpdate === 'function') {
        onStatsUpdate();
      }
    }, 1200);
  }
  function handleBookmark() {
    if (bookmarked) removeBookmark(currentQ.id);
    else addBookmark(currentQ.id);
  }
  return (
    <div
      className="quiz-card"
      role="region"
      aria-label="Quiz Card"
      tabIndex={-1}
      data-testid="quiz-card"
      ref={quizCardRef}
    >
      <div className="quiz-header-row" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="quiz-topic">Topic: <b>{currentQ.topic}</b></span>
        <span className="quiz-streak">Streak: <b>{streak}</b></span>
        <span className="quiz-qnum">Question {current + 1}/{quizPool.length}</span>
        <button
          className="bookmark-btn"
          id="bookmark-btn"
          data-testid="bookmark-btn"
          title={bookmarked ? "Remove bookmark" : "Bookmark this question"}
          aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
          onClick={handleBookmark}
          aria-pressed={bookmarked}
          style={{ marginLeft: 8 }}
        >
          {bookmarked ? "\u2605" : "\u2606"} <span className="bookmark-label">Bookmark</span>
        </button>
        <button
          aria-label="Show bookmarks list"
          title="Show bookmarks list"
          style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 8, cursor: 'pointer', padding: '6px 12px', marginLeft: 4, display: 'flex', alignItems: 'center', boxShadow: '0 2px 8px #0001', transition: 'background 0.2s', minHeight: 32 }}
          onClick={onToggleBookmarks}
          data-testid="toggle-bookmarks-list"
          onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
          onMouseOut={e => e.currentTarget.style.background = '#fff'}
        >
          <svg width="20" height="20" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <line x1="4" y1="6" x2="20" y2="6"/>
            <line x1="4" y1="12" x2="20" y2="12"/>
            <line x1="4" y1="18" x2="20" y2="18"/>
          </svg>
        </button>
      </div>
      <div className="question-meta"></div>
      <div className="question-text quiz-question question" id="question" aria-live="polite" data-testid="quiz-question">{currentQ.question}</div>
      <div className="answers" id="answers">
        {(currentQ.answers || []).map((a, i) => {
          const isActive = !showFeedback;
          return (
            <button
              key={i}
              className="answer-btn styled-menu-btn"
              data-idx={i}
              aria-label={`Answer ${i + 1}: ${a}`}
              data-testid={`answer-btn-${i}`}
              style={{
                margin: '8px 0',
                width: '100%',
                fontSize: 18,
                borderRadius: 8,
                border: '1px solid #ccc',
                background: selected === i ? (currentQ.correct === i ? '#6BCB77' : '#FF6B6B') : '#fff',
                color: '#222',
                cursor: isActive ? 'pointer' : 'not-allowed',
                opacity: isActive ? 1 : 0.7,
                pointerEvents: isActive ? 'auto' : 'none',
                transition: 'background 0.2s',
                display: isActive || selected === i ? 'block' : 'none',
              }}
              disabled={!isActive}
              onClick={() => handleAnswer(i)}
            >
              {a}
            </button>
          );
        })}
      </div>
      {/* Only render the next button when feedback is shown */}
      {showFeedback && (
        <button
          className="next-btn"
          data-testid="next-btn"
          style={{ marginTop: 16, padding: '8px 20px', fontSize: 18, borderRadius: 8, background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px #0003', display: 'block' }}
          onClick={() => {
            setCurrent(c => c + 1);
            setSelected(null);
            setShowFeedback(false);
            setFeedback("");
          }}
          aria-label={current < quizPool.length - 1 ? "Next question" : "Finish quiz"}
        >
          {current < quizPool.length - 1 ? "Next" : "Finish"}
        </button>
      )}
      <div className="feedback" style={{marginTop: "1em"}} aria-live="polite" data-testid="quiz-feedback">
        {showFeedback && (
          <>
            {feedback}
            <br />
          </>
        )}
      </div>
      <div className="progress-section">
        <span>Progress</span>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((current + (showFeedback ? 1 : 0)) / quizPool.length) * 100}%` }}></div>
        </div>
        <span>{Math.round(((current + (showFeedback ? 1 : 0)) / quizPool.length) * 100)}%</span>
      </div>
    </div>
  );
}