import React from 'react';

interface QuizErrorProps {
  error: string;
}

const QuizError: React.FC<QuizErrorProps> = ({ error }) => (
  <div style={{ color: '#ef4444', margin: '1rem 0', fontWeight: 600 }}>
    {error}
  </div>
);

export default QuizError;
