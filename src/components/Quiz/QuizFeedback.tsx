import React from 'react';

interface QuizFeedbackProps {
  show: boolean;
  feedback: string | null;
}

const QuizFeedback = ({ show, feedback }: QuizFeedbackProps) => {
  if (!show || feedback == null) return null;
  // Render feedback as string, preserving whitespace and newlines
  return (
    <div data-testid="quiz-feedback" style={{ whiteSpace: 'pre-line' }}>{String(feedback)}</div>
  );
};

export default QuizFeedback;
