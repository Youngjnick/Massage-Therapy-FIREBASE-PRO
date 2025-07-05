import React from 'react';
import QuizReviewIndicator from './QuizReviewIndicator';
import QuizSessionSummary from './QuizSessionSummary';
import QuizSessionCharts from './QuizSessionCharts';
import QuizTopicProgress from './QuizTopicProgress';

interface QuizResultsScreenProps {
  isAllIncorrect: boolean;
  onStartNewQuiz: () => void;
  topicStats: { [topic: string]: { correct: number; total: number } };
  q: any;
  userAnswers: (number | undefined)[];
  shuffledOptions: { [key: number]: string[] };
  activeQuestions: any[];
  onStartMissedUnansweredQuiz?: (topic: string) => void;
}

const QuizResultsScreen: React.FC<QuizResultsScreenProps> = ({
  isAllIncorrect,
  onStartNewQuiz,
  topicStats,
  q,
  userAnswers,
  shuffledOptions,
  activeQuestions,
  onStartMissedUnansweredQuiz,
}) => {
  // DEBUG: Log all props on mount
  React.useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[QUIZ RESULTS DEBUG] Props:', {
      isAllIncorrect,
      topicStats,
      q,
      userAnswers,
      shuffledOptions,
      activeQuestions,
    });
  }, []);
  // Defensive: If topicStats is missing or empty, do not render stats UI
  const safeTopicStats = topicStats && Object.keys(topicStats).length > 0 ? topicStats : {};
  return (
    <div className="quiz-results" data-testid="quiz-results">
      {isAllIncorrect && <QuizReviewIndicator />}
      <button
        role="button"
        aria-label="Start New Quiz"
        data-testid="start-new-quiz-btn"
        onClick={onStartNewQuiz}
        style={{ marginTop: '1rem', marginBottom: '1rem' }}
      >
        Start New Quiz
      </button>
      <h2>Results</h2>
      {/* Live stats UI components */}
      <QuizTopicProgress topicStats={safeTopicStats} onStartMissedUnansweredQuiz={onStartMissedUnansweredQuiz} />
      <QuizSessionCharts topicStats={safeTopicStats} />
      <QuizSessionSummary
        score={userAnswers.filter((a, i) => a !== undefined && (shuffledOptions[i] || (q && q.options) || []).length > 0 && (shuffledOptions[i] || (q && q.options) || [])[a] === (activeQuestions[i] && activeQuestions[i].correctAnswer)).length}
        total={activeQuestions.length}
        avgTime={0}
        maxStreak={(() => {
          let max = 0, curr = 0;
          for (let i = 0; i < userAnswers.length; i++) {
            if (
              userAnswers[i] !== undefined &&
              typeof userAnswers[i] === 'number' &&
              (shuffledOptions[i] || (activeQuestions[i] && activeQuestions[i].options) || [])[userAnswers[i] as number] === (activeQuestions[i] && activeQuestions[i].correctAnswer)
            ) {
              curr++;
              if (curr > max) max = curr;
            } else {
              curr = 0;
            }
          }
          return max;
        })()}
        topicStats={safeTopicStats}
        onClose={() => {}}
        onRetry={onStartNewQuiz}
        questions={activeQuestions}
        userAnswers={userAnswers}
        shuffledOptions={shuffledOptions}
      />
    </div>
  );
};

export default QuizResultsScreen;
