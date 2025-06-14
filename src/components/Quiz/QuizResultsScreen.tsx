import React from 'react';
import { getQuizFeedback } from '../../utils/quizFeedback';
import QuizReviewIndicator from './QuizReviewIndicator';
import QuizQuestionCard from './QuizQuestionCard';
import QuizReviewList from './QuizReviewList';
import QuizSessionSummary from './QuizSessionSummary';
import QuizSessionCharts from './QuizSessionCharts';
import QuizTopicProgress from './QuizTopicProgress';

interface QuizResultsScreenProps {
  isAllIncorrect: boolean;
  onStartNewQuiz: () => void;
  topicStats: { [topic: string]: { correct: number; total: number } };
  q: any;
  current: number;
  userAnswers: number[];
  shuffledOptions: { [key: number]: string[] };
  toggleState: {
    showExplanations: boolean;
    instantFeedback: boolean;
    randomizeQuestions: boolean;
    randomizeOptions: boolean;
  };
  reviewQueue: number[];
  activeQuestions: any[];
}

const QuizResultsScreen: React.FC<QuizResultsScreenProps> = ({
  isAllIncorrect,
  onStartNewQuiz,
  topicStats,
  q,
  current,
  userAnswers,
  shuffledOptions,
  toggleState,
  reviewQueue,
  activeQuestions,
}) => {
  // Compute feedback for the last question
  const feedback = getQuizFeedback(q, current, userAnswers, shuffledOptions);

  return (
    <div className="quiz-results">
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
      <QuizTopicProgress topicStats={topicStats} />
      <QuizSessionCharts topicStats={topicStats} />
      <QuizSessionSummary
        score={userAnswers.filter((a, i) => a !== undefined && (shuffledOptions[i] || (q && q.options) || []).length > 0 && (shuffledOptions[i] || (q && q.options) || [])[a] === (activeQuestions[i] && activeQuestions[i].correctAnswer)).length}
        total={activeQuestions.length}
        avgTime={0}
        maxStreak={(() => {
          let max = 0, curr = 0;
          for (let i = 0; i < userAnswers.length; i++) {
            if (userAnswers[i] !== undefined && (shuffledOptions[i] || (activeQuestions[i] && activeQuestions[i].options) || [])[userAnswers[i]] === (activeQuestions[i] && activeQuestions[i].correctAnswer)) {
              curr++;
              if (curr > max) max = curr;
            } else {
              curr = 0;
            }
          }
          return max;
        })()}
        topicStats={topicStats}
        onClose={() => {}}
        onRetry={onStartNewQuiz}
        questions={activeQuestions}
        userAnswers={userAnswers}
        shuffledOptions={shuffledOptions}
      />
      <div>
        {Object.entries(topicStats).map(([topic, stat]) => (
          <div key={topic}>
            <strong>{topic || 'Other'}</strong>: {stat.correct} / {stat.total}
          </div>
        ))}
      </div>
      <div style={{ margin: '1.5rem 0' }}>
        <QuizQuestionCard
          q={q || { text: 'No questions available', options: ['N/A'], correctAnswer: 'N/A', id: 'empty' }}
          current={current}
          userAnswers={userAnswers}
          answered={true}
          handleAnswer={() => {}}
          answerFeedback={feedback}
          showExplanations={toggleState.showExplanations}
          shuffledOptions={shuffledOptions}
          isReviewMode={isAllIncorrect}
          showInstantFeedback={toggleState.instantFeedback}
        />
      </div>
      {/* Review Section */}
      <div style={{ marginTop: '2rem' }}>
        <h3>Review Your Answers</h3>
        <QuizReviewList
          reviewQueue={reviewQueue}
          activeQuestions={activeQuestions}
          userAnswers={userAnswers}
          shuffledOptions={shuffledOptions}
        />
      </div>
    </div>
  );
};

export default QuizResultsScreen;
