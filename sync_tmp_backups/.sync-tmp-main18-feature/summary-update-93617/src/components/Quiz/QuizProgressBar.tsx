import React from 'react';

interface QuizProgressBarProps {
  progress: number; // 0-100
}

const QuizProgressBar: React.FC<QuizProgressBarProps> = ({ progress }) => (
  <div className="quiz-progress-bar" style={{ width: '100%', margin: '1rem 0' }}>
    <div
      className="quiz-progress-bar-inner"
      style={{ width: `${progress}%`, height: 10, background: 'linear-gradient(90deg, #6ee7b7, #3b82f6)', borderRadius: 8, transition: 'width 0.3s' }}
      aria-valuenow={progress}
      aria-valuemax={100}
      aria-valuemin={0}
      role="progressbar"
      tabIndex={0}
      aria-label={`Quiz progress: ${progress}%`}
    />
    <div style={{ textAlign: 'right', fontWeight: 600, marginTop: 4 }}>{progress} %</div>
  </div>
);

export default QuizProgressBar;
