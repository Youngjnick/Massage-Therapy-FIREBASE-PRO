import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useBookmarks } from "./BookmarkContext.jsx";
import { useAnalytics } from "./AnalyticsContext.jsx";
import type { Question } from "../utils";

interface QuizCardProps {
  questions: Question[];
  selectedTopic?: string;
  quizLength?: string | number;
  onToggleBookmarks?: () => void;
  onRestartQuiz?: () => void;
  onQuestionAnswered?: (qid: string, answeredIdx: number) => void;
}

/**
 * QuizCard - React version of the quiz card/question/answer area.
 * Props:
 *   questions: array - all questions
 *   selectedTopic: string - topic to filter
 *   quizLength: string|number - number of questions (or 'all')
 */
export default function QuizCard({
  questions = [],
  selectedTopic,
  quizLength,
  onToggleBookmarks,
  onRestartQuiz,
  onQuestionAnswered,
}: QuizCardProps) {
  // Debug: log props at top
  console.debug("[E2E DEBUG] QuizCard props:", {
    questions,
    selectedTopic,
    quizLength,
  });
  try {
    // Defensive: warn if questions is not an array
    if (!Array.isArray(questions)) {
      console.warn("[QuizCard] questions prop is not an array:", questions);
      questions = [];
    }

    // Always call hooks first
    const [current, setCurrent] = useState(0);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [correct, setCorrect] = useState(0);
    const [streak, setStreak] = useState(0);
    const quizCardRef = useRef<HTMLDivElement | null>(null);
    const { addBookmark, removeBookmark, isBookmarked } = useBookmarks() as {
      addBookmark: (id: string) => void;
      removeBookmark: (id: string) => void;
      isBookmarked: (id: string) => boolean;
    };
    const { updateAnalytics, errorMap, quizHistory, masteryHistory } = useAnalytics() as {
      updateAnalytics: (updates: Record<string, unknown>) => void;
      errorMap: Record<string, unknown>;
      quizHistory: unknown[];
      masteryHistory: unknown[];
    };
    // Remove unused earnBadge and selected state

    // Defensive: handle missing questions prop
    const hasQuestions = !!questions && Array.isArray(questions);
    const filtered = useMemo(
      () =>
        hasQuestions && selectedTopic
          ? questions.filter((q) => q.topic === selectedTopic)
          : hasQuestions
            ? questions
            : [],
      [hasQuestions, questions, selectedTopic],
    );
    const quizPool = useMemo(
      () =>
        quizLength === "all"
          ? filtered
          : filtered.slice(0, Number(quizLength) || 0),
      [filtered, quizLength],
    );
    const currentQ = useMemo(
      () =>
        quizPool && quizPool.length > 0 && current < quizPool.length
          ? quizPool[current]
          : null,
      [quizPool, current],
    );
    const bookmarked = useMemo(
      () => (currentQ ? isBookmarked(currentQ.id) : false),
      [currentQ, isBookmarked],
    );

    useEffect(() => {
      if (quizCardRef.current) quizCardRef.current.focus();
    }, [current]);

    // Debug: log questions array length
    console.log(
      "[QuizCard] questions prop length:",
      questions ? questions.length : 0,
    );

    if (!hasQuestions || questions.length === 0) {
      return (
        <div
          className="quiz-card visible no-questions"
          role="region"
          aria-label="Quiz Area"
          data-testid="quiz-card-empty"
        >
          Failed to load questions
        </div>
      );
    }
    if (!quizPool.length) {
      return (
        <div
          className="quiz-card visible no-questions"
          role="region"
          aria-label="Quiz Area"
          data-testid="quiz-card-no-topic"
        >
          No questions available for the selected topic/length.
        </div>
      );
    }
    if (current >= quizPool.length) {
      return (
        <div
          className="quiz-card visible"
          role="region"
          aria-label="Quiz Area"
          data-testid="quiz-card-complete"
        >
          Quiz complete! Score: {correct}/{quizPool.length}
          <br />
          <button
            className="app-btns"
            style={{
              marginTop: 16,
              padding: "8px 20px",
              fontSize: 18,
              borderRadius: 8,
              background: "#222",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 8px #0003",
            }}
            onClick={() =>
              typeof onRestartQuiz === "function" && onRestartQuiz()
            }
            data-testid="restart-quiz-btn"
          >
            Start New Quiz
          </button>
        </div>
      );
    }
    if (!currentQ) {
      return (
        <div
          className="quiz-card visible no-questions"
          role="region"
          aria-label="Quiz Area"
          data-testid="quiz-card-error"
        >
          Question data is missing or invalid.
        </div>
      );
    }
    const handleAnswer = useCallback(
      (idx: number) => {
        if (showFeedback) return;
        setShowFeedback(true);
        const isCorrect = currentQ.correct === idx;
        setFeedback(isCorrect ? "Correct!" : "Incorrect.");
        if (typeof onQuestionAnswered === "function") {
          onQuestionAnswered(currentQ.id, idx);
        }
        // Compute up-to-date correct and streak from quizPool after answer
        const updatedQuizPool = quizPool.map((q, i) =>
          i === current ? { ...q, answered: idx } : q,
        );
        const correctCount = updatedQuizPool.filter(
          (q) => q.answered === q.correct,
        ).length;
        let currStreak = 0,
          bestStreak = 0;
        updatedQuizPool.forEach((q) => {
          if (q.answered === q.correct) {
            currStreak++;
            bestStreak = Math.max(bestStreak, currStreak);
          } else {
            currStreak = 0;
          }
        });
        setCorrect(correctCount);
        setStreak(bestStreak);
        // Error map
        let newErrorMap = { ...errorMap };
        if (!isCorrect) {
          const prev = typeof newErrorMap[currentQ.id] === 'number' ? (newErrorMap as Record<string, number>)[currentQ.id] : 0;
          (newErrorMap as Record<string, number>)[currentQ.id] = prev + 1;
        }
        // Quiz history
        let newQuizHistory = Array.isArray(quizHistory) ? [...quizHistory] : [];
        if (current + 1 >= quizPool.length) {
          newQuizHistory.push({
            date: new Date().toISOString(),
            score: correctCount,
            total: quizPool.length,
            streak: bestStreak,
            topic: selectedTopic,
          });
        }
        // Mastery history
        let newMasteryHistory = Array.isArray(masteryHistory)
          ? [...masteryHistory]
          : [];
        if (current + 1 >= quizPool.length) {
          const percent = (correctCount / quizPool.length) * 100;
          newMasteryHistory.push({
            date: new Date().toISOString(),
            avgMastery: Math.round(percent),
          });
        }
        updateAnalytics({
          correct: correctCount,
          streak: bestStreak,
          total: quizPool.length,
          completed: current + 1 >= quizPool.length ? 1 : 0,
          quizHistory: newQuizHistory,
          masteryHistory: newMasteryHistory,
          errorMap: newErrorMap,
        });
        setTimeout(() => {
          setCurrent((c) => c + 1);
          setShowFeedback(false);
          setFeedback("");
        }, 900);
      },
      [showFeedback, currentQ, current, quizPool, onQuestionAnswered, updateAnalytics, errorMap, quizHistory, masteryHistory, selectedTopic],
    );
    function handleBookmark() {
      if (!currentQ) return;
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
        <div
          className="quiz-header-row"
          style={{ display: "flex", alignItems: "center", gap: 12 }}
        >
          <span className="quiz-topic">
            Topic: <b>{currentQ.topic}</b>
          </span>
          <span className="quiz-streak">
            Streak: <b>{streak}</b>
          </span>
          <span className="quiz-qnum">
            Question {current + 1}/{quizPool.length}
          </span>
          <button
            className="app-btns"
            id="bookmark-btn"
            data-testid="bookmark-btn"
            title={bookmarked ? "Remove bookmark" : "Bookmark this question"}
            aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
            onClick={handleBookmark}
            aria-pressed={bookmarked}
            style={{ marginLeft: 8 }}
          >
            {bookmarked ? "\u2605" : "\u2606"}{" "}
            <span className="bookmark-label">Bookmark</span>
          </button>
          <button
            className="app-btns"
            aria-label="Show bookmarks list"
            title="Show bookmarks list"
            onClick={onToggleBookmarks}
            data-testid="toggle-bookmarks-list"
          >
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="#222"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
        </div>
        <div className="question-meta"></div>
        <div
          className="question-text quiz-question question"
          id="question"
          aria-live="polite"
          data-testid="quiz-question"
        >
          {typeof currentQ.question === "string" ? currentQ.question : ""}
        </div>
        <div className="answers" id="answers">
          {Array.isArray(currentQ.answers)
            ? currentQ.answers.map((a: string, i: number) => {
                const isActive = !showFeedback;
                return (
                  <button
                    key={i}
                    className="app-btns"
                    data-idx={i}
                    aria-label={`Answer ${i + 1}: ${a}`}
                    data-testid={`answer-btn-${i}`}
                    style={{ margin: "8px 0", width: "100%" }}
                    onClick={() => handleAnswer(i)}
                    disabled={!isActive}
                  >
                    {a}
                  </button>
                );
              })
            : null}
        </div>
        {/* Only render the next button when feedback is shown */}
        {showFeedback && (
          <button
            className="app-btns"
            data-testid="next-btn"
            style={{
              marginTop: 16,
              padding: "8px 20px",
              fontSize: 18,
              borderRadius: 8,
              display: "block",
            }}
            onClick={() => {
              setCurrent((c) => c + 1);
              setShowFeedback(false);
              setFeedback("");
            }}
            aria-label={
              current < quizPool.length - 1 ? "Next question" : "Finish quiz"
            }
          >
            {current < quizPool.length - 1 ? "Next" : "Finish"}
          </button>
        )}
        <div
          className="feedback"
          style={{ marginTop: "1em" }}
          aria-live="polite"
          data-testid="quiz-feedback"
        >
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
            <div
              className="progress-fill"
              style={{
                width: `${((current + (showFeedback ? 1 : 0)) / quizPool.length) * 100}%`,
              }}
            ></div>
          </div>
          <span>
            {Math.round(
              ((current + (showFeedback ? 1 : 0)) / quizPool.length) * 100,
            )}
            %
          </span>
        </div>
      </div>
    );
  } catch (err) {
    console.error("[E2E DEBUG] QuizCard render error:", err);
    return (
      <div
        className="quiz-card visible error"
        role="region"
        aria-label="Quiz Area"
        data-testid="quiz-card-error"
      >
        QuizCard error: {String(err)}
      </div>
    );
  }
}
