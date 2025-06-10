import React from 'react';

interface QuizFeedbackProps {
  show: boolean;
  feedback: string | null;
}

const QuizFeedback = ({ show, feedback }: QuizFeedbackProps) => {
  if (!show || feedback == null) return null;
  if (typeof feedback === 'symbol') return null;
  let feedbackStr: string;
  try {
    feedbackStr = String(feedback);
  } catch {
    return null;
  }
  return (
    <div data-testid="quiz-feedback" style={{ whiteSpace: 'pre-line' }}>{feedbackStr}</div>
  );
};

export default QuizFeedback;
