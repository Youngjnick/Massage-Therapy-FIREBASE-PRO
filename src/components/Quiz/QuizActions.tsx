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
      aria-disabled={current === 0}
    >
      Previous
    </button>
    {/* Always render Next button, but disable and hide as appropriate */}
    <button
      onClick={onNext}
      disabled={current >= total - 1 || !answered}
      aria-label="Next question"
      role="button"
      aria-disabled={current >= total - 1 || !answered}
      style={{ visibility: current < total - 1 ? 'visible' : 'hidden' }}
      tabIndex={current < total - 1 ? 0 : -1}
      data-testid="quiz-next-btn"
    >
      Next
    </button>
    {/* Render Finish (cancel) button for mid-quiz exit, and Finish Quiz button on last question */}
    {current < total - 1 && (
      <button
        onClick={() => {
          console.log('[QuizActions] Finish (cancel) clicked', { answered, current, total });
          onFinish();
        }}
        aria-label="Finish quiz early"
        role="button"
        aria-disabled={false}
        data-testid="quiz-cancel-btn"
        style={{ marginLeft: 8 }}
      >
        Finish
      </button>
    )}
    {/* Only show Finish Quiz button on last question AND after it is answered */}
    {current === total - 1 && answered && (
      <button
        onClick={() => {
          console.log('[QuizActions] Finish clicked', { answered, current, total });
          onFinish();
        }}
        aria-label="Finish quiz"
        role="button"
        data-testid="quiz-finish-btn"
        style={{ marginLeft: 8 }}
      >
        Finish Quiz
      </button>
    )}
  </div>
);

export default QuizActions;
