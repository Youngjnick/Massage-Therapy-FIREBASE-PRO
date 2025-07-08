import React from 'react';

interface QuizLoadingProps {
  message?: string;
}

const QuizLoading: React.FC<QuizLoadingProps> = ({ message = 'Loading questions...' }) => (
  <div style={{ color: '#64748b', margin: '1rem 0', fontWeight: 500 }}>
    {message}
  </div>
);

export default QuizLoading;
