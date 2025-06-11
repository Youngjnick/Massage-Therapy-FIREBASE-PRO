import React from 'react';

interface QuizActionsProps {
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
  onCancel: () => void;
  current: number;
  total: number;
  answered: boolean;
}

const QuizActions: React.FC<QuizActionsProps> = ({
  onPrev,
  onNext,
  onFinish,
  onCancel,
  current,
  total,
  answered,
}) => (
  <div className="quiz-actions">
    <button onClick={onPrev} disabled={current === 0}>Previous</button>
    {current < total - 1 ? (
      <button onClick={onNext} disabled={!answered}>Next</button>
    ) : (
      <button onClick={onFinish} disabled={!answered}>Finish</button>
    )}
    <button onClick={onCancel}>Cancel</button>
  </div>
);

export default QuizActions;
