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
  showInstantFeedback: boolean;
  answerFeedback: string | null;
  showReview: boolean;
  bookmarks: string[];
  toggleBookmark: (id: string) => void;
  handleReportError: (id: string) => void;
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
  showInstantFeedback,
  answerFeedback,
  showReview,
  bookmarks,
  toggleBookmark,
  handleReportError,
}) => (
  <div>
    <div style={{ fontWeight: 600, marginBottom: 8 }}>{q.text}</div>
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {(shuffledOptions[current] || q.options).map((opt: string, i: number) => {
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
              inputRef={optionRefs.current[i] ? { current: optionRefs.current[i] } : undefined}
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
      <button onClick={() => {}}>Cancel</button>
      <span>
        {current + 1} / 1
      </span>
      {answered && <span>Answered</span>}
    </div>
  </div>
);

export default QuizQuestionCard;
