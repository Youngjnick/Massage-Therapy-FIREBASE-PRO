import React from 'react';

interface QuizModalContentProps {
  type: 'summary' | 'error' | 'info' | string;
  children: React.ReactNode;
}

const QuizModalContent: React.FC<QuizModalContentProps> = ({ type, children }) => (
  <div className={`quiz-modal-content quiz-modal-content-${type}`} style={{ padding: 24 }}>
    {children}
  </div>
);

export default QuizModalContent;
