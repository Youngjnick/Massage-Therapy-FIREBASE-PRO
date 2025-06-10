import React from 'react';
import QuizOption from './QuizOption';
import QuizFeedback from './QuizFeedback';
import QuizExplanation from './QuizExplanation';
import QuizActions from './QuizActions';

interface QuizQuestionCardProps {
  q: any;
  current: number;
  userAnswers: number[];
  answered: boolean;
  handleAnswer: (idx: number) => void;
  optionRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  bookmarks: string[];
  toggleBookmark: (id: string) => void;
  handleReportError: (id: string) => void;
  showInstantFeedback: boolean;
  answerFeedback: string | null;
  showExplanations: boolean;
  showReview: boolean;
  shuffledOptions: { [key: number]: string[] };
}

const QuizQuestionCard: React.FC<QuizQuestionCardProps> = ({
  q,
  current,
  userAnswers,
  answered,
  handleAnswer,
  optionRefs,
  bookmarks,
  toggleBookmark,
  handleReportError,
  showInstantFeedback,
  answerFeedback,
  showExplanations,
  showReview,
  shuffledOptions,
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
    <QuizFeedback show={showInstantFeedback} feedback={answerFeedback} />
    {showExplanations && (
      <QuizExplanation
        shortExplanation={q.short_explanation}
        longExplanation={q.long_explanation}
        clinicalApplication={q.clinical_application}
        sourceReference={q.source_reference}
        tags={q.tags}
        keywords={q.keywords}
      />
    )}
    <QuizActions
      onPrev={() => {}}
      onNext={() => {}}
      onFinish={() => {}}
      onCancel={() => {}}
      current={current}
      total={1}
      answered={answered}
    />
  </div>
);

export default QuizQuestionCard;
