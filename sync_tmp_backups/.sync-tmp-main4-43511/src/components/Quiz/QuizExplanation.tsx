import React from 'react';

interface QuizExplanationProps {
  shortExplanation?: string;
  longExplanation?: string;
  clinicalApplication?: string;
  sourceReference?: string;
  tags?: string[];
  keywords?: string[];
}

const QuizExplanation: React.FC<QuizExplanationProps> = ({
  shortExplanation,
  longExplanation,
  clinicalApplication,
  sourceReference,
  tags,
  keywords,
}) => (
  <>
    {shortExplanation && (
      <div className="quiz-explanation">Quick Tip: {shortExplanation}</div>
    )}
    {longExplanation && (
      <div style={{ color: '#2563eb', marginTop: 8, fontSize: 15 }}>More Info: {longExplanation}</div>
    )}
    {clinicalApplication && (
      <div style={{ color: '#64748b', marginTop: 8, fontSize: 14 }}>Clinical Application: {clinicalApplication}</div>
    )}
    {sourceReference && (
      <div style={{ color: '#a16207', marginTop: 8, fontSize: 13 }}>Source: {sourceReference}</div>
    )}
    {(tags || keywords) && (
      <div style={{ color: '#64748b', marginTop: 8, fontSize: 13 }}>
        {tags && tags.length > 0 && <span>Tags: {tags.join(', ')} </span>}
        {keywords && keywords.length > 0 && <span>Keywords: {keywords.join(', ')}</span>}
      </div>
    )}
  </>
);

export default QuizExplanation;
