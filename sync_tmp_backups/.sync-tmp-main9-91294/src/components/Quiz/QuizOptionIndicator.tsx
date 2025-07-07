import React from 'react';

interface QuizOptionIndicatorProps {
  isCorrect?: boolean;
  isIncorrect?: boolean;
  isSelected?: boolean;
}

const QuizOptionIndicator: React.FC<QuizOptionIndicatorProps> = ({ isCorrect, isIncorrect, isSelected }) => {
  if (isCorrect) return <span className="quiz-option-indicator correct" title="Correct" style={{ marginLeft: 8 }}>✔️</span>;
  if (isIncorrect) return <span className="quiz-option-indicator incorrect" title="Incorrect" style={{ marginLeft: 8 }}>❌</span>;
  if (isSelected) return <span className="quiz-option-indicator selected" title="Selected" style={{ marginLeft: 8 }}>•</span>;
  return null;
};

export default QuizOptionIndicator;
