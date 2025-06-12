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
        aria-label="No questions"
        aria-current="step"
        disabled
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
          aria-label={`Go to question ${idx + 1}`}
          aria-current={idx === current ? 'step' : undefined}
          onClick={() => onStep(idx)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onStep(idx);
            }
          }}
        />
      ))
    )}
  </div>
);

export default QuizStepper;
