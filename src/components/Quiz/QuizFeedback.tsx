import React from 'react';

interface QuizFeedbackProps {
  show: boolean;
  feedback: any; // Accept any type for robust handling
}

const QuizFeedback: React.FC<QuizFeedbackProps> = ({ show, feedback }) => {
  if (!show) return null;

  // Do not render if feedback is a valid React element or a symbol
  if (React.isValidElement(feedback) || typeof feedback === 'symbol') return null;

  // Handle function, object, array, boolean, null, undefined, etc.
  let display = '';
  if (typeof feedback === 'function') {
    display = feedback.toString();
  } else if (Array.isArray(feedback)) {
    display = feedback.join(',');
  } else if (feedback !== null && feedback !== undefined) {
    display = String(feedback);
  }

  return (
    <div
      className="quiz-feedback"
      data-testid="quiz-feedback"
      style={{ color: display === 'Correct!' ? '#059669' : '#ef4444' }}
    >
      {display}
    </div>
  );
};

export default QuizFeedback;
