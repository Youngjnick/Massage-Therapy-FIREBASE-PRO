import React from 'react';

interface QuizFeedbackMessageProps {
  message: string;
  type?: 'success' | 'error' | 'info';
}

const getColor = (type?: string) => {
  switch (type) {
    case 'success': return '#22c55e';
    case 'error': return '#ef4444';
    case 'info':
    default: return '#3b82f6';
  }
};

const QuizFeedbackMessage: React.FC<QuizFeedbackMessageProps> = ({ message, type }) => (
  <div style={{ color: getColor(type), margin: '0.5rem 0', fontWeight: 500 }}>
    {message}
  </div>
);

export default QuizFeedbackMessage;
