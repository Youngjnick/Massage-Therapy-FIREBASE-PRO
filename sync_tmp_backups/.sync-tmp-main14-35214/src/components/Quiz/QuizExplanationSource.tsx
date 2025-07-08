import React from 'react';

interface QuizExplanationSourceProps {
  sourceReference?: string;
}

const QuizExplanationSource: React.FC<QuizExplanationSourceProps> = ({ sourceReference }) => (
  sourceReference ? (
    <div style={{ marginTop: 4, fontSize: '0.95em', color: '#64748b' }}>
      <strong>Source:</strong> {sourceReference}
    </div>
  ) : null
);

export default QuizExplanationSource;
