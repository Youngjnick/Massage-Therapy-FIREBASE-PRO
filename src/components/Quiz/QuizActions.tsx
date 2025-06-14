import React from 'react';

interface QuizActionsProps {
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
  current: number;
  total: number;
  answered: boolean;
}

const QuizActions: React.FC<QuizActionsProps> = ({
  onPrev,
  onNext,
  onFinish,
  current,
  total,
  answered,
}) => (
  <div className="quiz-actions">
    <button onClick={onPrev} disabled={current === 0} aria-label="Previous question">Previous</button>
    {current < total - 1 ? (
      <>
        <button onClick={onNext} disabled={!answered} aria-label="Next question">Next</button>
        <button onClick={onFinish} aria-label="Finish quiz early">Finish</button>
      </>
    ) : (
      <button onClick={onFinish} disabled={!answered} aria-label="Finish quiz">Finish Quiz</button>
    )}
  </div>
);

export default QuizActions;
