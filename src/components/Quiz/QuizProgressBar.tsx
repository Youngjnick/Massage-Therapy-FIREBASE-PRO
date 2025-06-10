import React from 'react';

interface QuizProgressBarProps {
  progress: number; // 0-100
}

const QuizProgressBar: React.FC<QuizProgressBarProps> = ({ progress }) => (
  <div className="quiz-progress-bar">
    <div className="quiz-progress-bar-inner" style={{ width: `${progress}%` }} />
  </div>
);

export default QuizProgressBar;
