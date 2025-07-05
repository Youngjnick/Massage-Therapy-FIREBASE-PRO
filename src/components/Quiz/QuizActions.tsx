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
  <div className="quiz-actions" role="group" aria-label="Quiz navigation actions">
    <button
      onClick={onPrev}
      disabled={current === 0}
      aria-label="Previous question"
      role="button"
      aria-disabled={current === 0 ? "true" : "false"}
    >
      Previous
    </button>
    {/* Always render Next button, but disable and hide as appropriate */}
    <button
      onClick={onNext}
      disabled={current >= total - 1 || !answered}
      aria-label="Next question"
      role="button"
      aria-disabled={current >= total - 1 || !answered ? "true" : "false"}
      style={{ visibility: current < total - 1 ? 'visible' : 'hidden' }}
      tabIndex={current < total - 1 ? 0 : -1}
      data-testid="quiz-next-btn"
    >
      Next
    </button>
    {/* Always render Finish button */}
    <button
      onClick={() => {
        console.log('[QuizActions] Finish clicked', { answered, current, total });
        onFinish();
      }}
      aria-label={current < total - 1 ? 'Finish quiz early' : 'Finish quiz'}
      role="button"
      disabled={!answered}
      aria-disabled={!answered ? "true" : "false"}
    >
      {current < total - 1 ? 'Finish' : 'Finish Quiz'}
    </button>
  </div>
);

export default QuizActions;
