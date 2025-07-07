import React from 'react';

interface QuizSessionStatProps {
  label: string;
  value: React.ReactNode;
}

const QuizSessionStat: React.FC<QuizSessionStatProps> = ({ label, value }) => (
  <div style={{ margin: '8px 0', fontSize: '1.05em' }}>
    <strong>{label}:</strong> {value}
  </div>
);

export default QuizSessionStat;
