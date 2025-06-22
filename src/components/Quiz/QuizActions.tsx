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
    {/* Always render Next button, but disable and hide as appropriate */}
    <button
      onClick={onNext}
      disabled={current >= total - 1 || !answered}
      aria-label="Next question"
      style={{ visibility: current < total - 1 ? 'visible' : 'hidden', position: 'absolute' }}
      tabIndex={current < total - 1 ? 0 : -1}
      data-testid="quiz-next-btn"
    >
      Next
    </button>
    {/* Always render Finish button, but disable as appropriate */}
    <button
      onClick={onFinish}
      disabled={!answered}
      aria-label={current < total - 1 ? 'Finish quiz early' : 'Finish quiz'}
    >
      {current < total - 1 ? 'Finish' : 'Finish Quiz'}
    </button>
  </div>
);

export default QuizActions;
