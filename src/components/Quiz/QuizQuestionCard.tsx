import React from 'react';
import QuizOption from './QuizOption';
import QuizExplanation from './QuizExplanation';
import QuizActions from './QuizActions';

interface QuizQuestionCardProps {
  q: any;
  current: number;
  userAnswers: number[];
  answered: boolean;
  handleAnswer: (idx: number, submit?: boolean) => void;
  optionRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  answerFeedback: string | null;
  showExplanations: boolean;
  shuffledOptions: { [key: number]: string[] };
  isReviewMode: boolean;
  suppressTestId?: boolean;
}

const QuizQuestionCard: React.FC<QuizQuestionCardProps> = ({
  q,
  current,
  userAnswers,
  answered,
  handleAnswer,
  optionRefs,
  answerFeedback,
  showExplanations,
  shuffledOptions,
  isReviewMode,
  suppressTestId = false,
}) => {
  // Generate a unique instance id for this question card (per mount)
  // Use window.crypto.randomUUID() for true uniqueness if available
  const [questionInstanceId] = React.useState(() => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2);
  });

  // Defensive check: ensure q is always defined and has required properties
  const safeQ =
    q && typeof q === 'object' && q.text && Array.isArray(q.options)
      ? q
      : { text: 'No questions available', options: ['N/A'], correctAnswer: 'N/A', id: 'empty' };

  // Determine if the answer is correct
  const isCorrect = answered && userAnswers[current] === safeQ.correctAnswer;

  return (
    <div {...(!suppressTestId ? { 'data-testid': 'quiz-question-card' } : {})}>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 600, marginBottom: 8 }}>{safeQ.text}</legend>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {(shuffledOptions[current] || safeQ.options).map((opt: string, i: number) => {
            const optionClass =
              userAnswers[current] === i
                ? answered
                  ? (shuffledOptions[current] || safeQ.options)[i] === safeQ.correctAnswer
                    ? 'correct'
                    : 'incorrect'
                  : 'selected'
                : '';
            // Use a unique question identifier for inputId
            const safeQuestionId = safeQ.id || (safeQ.text ? safeQ.text.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) : current);
            // Add current index and questionInstanceId to inputId to ensure uniqueness even for repeated questions
            const inputId = `quiz-option-${safeQuestionId}-${i}-${current}-${questionInstanceId}`;
            const name = `quiz-question-${safeQuestionId}-${current}-${questionInstanceId}`;
            // Add current index, questionInstanceId, and answered to key for correct remounting
            const optionKey = `${inputId}-${answered}`;
            return (
              <li key={optionKey}>
                <QuizOption
                  key={optionKey}
                  label={String.fromCharCode(65 + i)}
                  option={opt}
                  selected={userAnswers[current] === i}
                  disabled={answered ? true : false}
                  onSelect={() => {
                    if (!answered) handleAnswer(i, false);
                  }}
                  onSubmitOption={() => {
                    if (!answered) handleAnswer(i, true);
                  }}
                  className={optionClass}
                  inputRef={optionRefs.current[i] ? { current: optionRefs.current[i] } : undefined}
                  inputId={inputId}
                  name={name}
                  autoFocus={current === 0 && i === 0}
                >
                  {/* Bookmark and error buttons can be slotted here if needed */}
                </QuizOption>
              </li>
            );
          })}
        </ul>
      </fieldset>
      {/* Feedback: only render if answered and answerFeedback is not null */}
      {answered && answerFeedback && (
        <div
          data-testid="quiz-feedback"
          className="quiz-feedback"
          style={{
            color: isCorrect ? '#059669' : '#ef4444',
            marginTop: 8,
            fontSize: 15,
          }}
        >
          {answerFeedback || ''}
        </div>
      )}
      {showExplanations && (
        <QuizExplanation
          shortExplanation={safeQ.short_explanation}
          longExplanation={safeQ.long_explanation}
          clinicalApplication={safeQ.clinical_application}
          sourceReference={safeQ.source_reference}
          tags={safeQ.tags}
          keywords={safeQ.keywords}
        />
      )}
      {/* Pass correct onFinish handler to QuizActions */}
      <QuizActions
        onPrev={() => {}}
        onNext={() => {}}
        onFinish={() => {
          // Call handleAnswer with the selected answer and true
          if (typeof userAnswers[current] === 'number') {
            handleAnswer(userAnswers[current], true);
          }
        }}
        onCancel={() => {}}
        current={current}
        total={1}
        answered={answered}
      />
      {/* Remove progress bar and stepper from here, only render in parent */}
      {isReviewMode && (
        <div data-testid="review-mode-indicator" style={{ marginTop: 16, textAlign: 'center', color: '#1d4ed8', fontWeight: 600 }}>
          <h2>Review</h2>
        </div>
      )}
    </div>
  );
};

export default QuizQuestionCard;
