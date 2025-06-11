import React from 'react';

interface QuizFeedbackProps {
  show: boolean;
  feedback: string | null;
}

const QuizFeedback: React.FC<QuizFeedbackProps> = ({ show, feedback }) => {
  if (!show || !feedback) return null;
  return (
    <div className="quiz-feedback" style={{ color: feedback === 'Correct!' ? '#059669' : '#ef4444' }}>
      {feedback}
    </div>
  );
};

export default QuizFeedback;
