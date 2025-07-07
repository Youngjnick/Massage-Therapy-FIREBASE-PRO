import React from 'react';

interface TopicStat {
  correct: number;
  total: number;
}

interface QuizSessionSummaryProps {
  score: number;
  total: number;
  avgTime: string | number;
  maxStreak: number;
  topicStats: { [topic: string]: TopicStat };
  onClose: () => void;
  onRetry: () => void;
  questions: any[];
  userAnswers: number[];
  shuffledOptions: { [key: number]: string[] };
}

const QuizSessionSummary: React.FC<QuizSessionSummaryProps> = ({
  score,
  total,
  avgTime,
  maxStreak,
  topicStats,
  onClose,
  onRetry,
  questions,
  userAnswers,
  shuffledOptions,
}) => (
  <div className="modal-summary">
    <div>
      <h2>Quiz Results</h2>
      <p>Your score: {score} / {total}</p>
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
      <button onClick={onRetry}>Try Another Quiz</button>
      <ul style={{ marginTop: 24 }}>
        {questions.map((q: any, i: number) => {
          const userAnswerIdx = userAnswers[i];
          const userAnswer = userAnswerIdx !== undefined ? (shuffledOptions[i] || q.options)[userAnswerIdx] : null;
          const isUnanswered = userAnswerIdx === undefined;
          return (
            <li key={q.id} style={{ marginBottom: 16, opacity: isUnanswered ? 0.6 : 1 }}>
              <strong>{q.question}</strong><br />
              <span>
                Your answer: {isUnanswered ? <span style={{ color: '#b91c1c', fontWeight: 600 }}>No answer</span> : userAnswer}
              </span><br />
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
            </li>
          );
        })}
      </ul>
      <div style={{ marginTop: 16, fontWeight: 600 }}>
        Answered: {userAnswers.filter(a => a !== undefined).length} / {questions.length}
        {userAnswers.some(a => a === undefined) && (
          <span style={{ color: '#b91c1c', marginLeft: 8 }}>(Some questions were skipped or left unanswered)</span>
        )}
      </div>
      <button onClick={onClose} style={{ marginTop: 24 }}>Close</button>
    </div>
  </div>
);

export default QuizSessionSummary;
