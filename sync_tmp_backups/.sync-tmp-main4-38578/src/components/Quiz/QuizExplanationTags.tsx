import React from 'react';

interface QuizExplanationTagsProps {
  tags?: string[];
  keywords?: string[];
}

const QuizExplanationTags: React.FC<QuizExplanationTagsProps> = ({ tags, keywords }) => (
  <div style={{ marginTop: 4, fontSize: '0.95em', color: '#64748b' }}>
    {tags && tags.length > 0 && (
      <span><strong>Tags:</strong> {tags.join(', ')} </span>
    )}
    {keywords && keywords.length > 0 && (
      <span><strong>Keywords:</strong> {keywords.join(', ')}</span>
    )}
  </div>
);

export default QuizExplanationTags;
