import React from 'react';

interface QuizStepperProps {
  total: number;
  current: number;
  answered: boolean[];
  onStep: (idx: number) => void;
}

const QuizStepper: React.FC<QuizStepperProps> = ({ total, current, answered, onStep }) => (
  <div className="quiz-stepper" aria-label="Question Progress" role="group">
    {total === 0 ? (
      <button
        type="button"
        className="quiz-stepper-dot"
        aria-current="step"
        aria-label="Current step"
        disabled
        data-testid="quiz-stepper-dot"
      />
    ) : (
      Array.from({ length: total }).map((_, idx) => (
        <button
          key={idx}
          type="button"
          className={
            'quiz-stepper-dot' +
            (idx === current ? ' active' : '') +
            (answered[idx] ? ' answered' : '')
          }
          aria-current={idx === current ? 'step' : undefined}
          aria-label={`Go to question ${idx + 1}${answered[idx] ? ' (answered)' : ''}${idx === current ? ' (current)' : ''}`}
          role="button"
          onClick={() => onStep(idx)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onStep(idx);
            }
          }}
          data-testid="quiz-stepper-dot"
        />
      ))
    )}
  </div>
);

export default QuizStepper;
