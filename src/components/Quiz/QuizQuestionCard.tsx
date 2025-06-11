import React from 'react';
import QuizOption from './QuizOption';

interface QuizQuestionCardProps {
  q: any;
  current: number;
  userAnswers: number[];
  answered: boolean;
  handleAnswer: (idx: number) => void;
  optionRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  showExplanations: boolean;
  shuffledOptions: { [key: number]: string[] };
}

const QuizQuestionCard: React.FC<QuizQuestionCardProps> = ({
  q,
  current,
  userAnswers,
  answered,
  handleAnswer,
  optionRefs,
  showExplanations,
  shuffledOptions,
}) => {
  return (
    <div data-testid="quiz-question-card">
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{q.text}</div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {(shuffledOptions[current] || q.options).map((opt: string, i: number) => {
          // Ensure optionRefs.current[i] is a ref for this option
          const setRef = (el: HTMLInputElement | null) => {
            optionRefs.current[i] = el;
          };
          const optionClass =
            userAnswers[current] === i
              ? answered
                ? (shuffledOptions[current] || q.options)[i] === q.correctAnswer
                  ? 'correct'
                  : 'incorrect'
                : 'selected'
              : '';
          return (
            <li key={i}>
              <QuizOption
                label={String.fromCharCode(65 + i)}
                option={opt}
                selected={userAnswers[current] === i}
                disabled={answered}
                onSelect={() => handleAnswer(i)}
                className={optionClass}
                inputRef={setRef}
                data-testid="quiz-option"
              >
                {/* Bookmark and error buttons can be slotted here if needed */}
              </QuizOption>
            </li>
          );
        })}
      </ul>
      {showExplanations && (
        <div>
          {q.short_explanation && <div>{q.short_explanation}</div>}
          {q.long_explanation && <div>{q.long_explanation}</div>}
          {q.clinical_application && <div>{q.clinical_application}</div>}
          {q.source_reference && <div>{q.source_reference}</div>}
          {q.tags && <div>{q.tags}</div>}
          {q.keywords && <div>{q.keywords}</div>}
        </div>
      )}
      <div>
        <button onClick={() => {}}>Prev</button>
        <button onClick={() => {}}>Next</button>
        <button onClick={() => {}}>Finish</button>
        <span>
          {current + 1} / 1
        </span>
        {answered && <span>Answered</span>}
      </div>
      {/* Show feedback if answered */}
      {answered && (
        <div data-testid="quiz-feedback" style={{ marginTop: 12 }}>
          {/* You can customize feedback text here, e.g. Correct/Incorrect */}
          {userAnswers[current] === (shuffledOptions[current] || q.options).indexOf(q.correctAnswer)
            ? 'Correct!'
            : 'Incorrect.'}
        </div>
      )}
    </div>
  );
};

export default QuizQuestionCard;
