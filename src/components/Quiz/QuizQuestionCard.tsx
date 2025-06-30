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
  answerFeedback: string | null;
  showExplanations: boolean;
  shuffledOptions: { [key: number]: string[] };
  isReviewMode: boolean;
  showInstantFeedback: boolean;
  // Add navigation handlers
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
  total: number;
  disableAllOptions?: boolean; // Add this prop
}

const QuizQuestionCard: React.FC<QuizQuestionCardProps> = ({
  q,
  current,
  userAnswers,
  handleAnswer,
  answerFeedback,
  showExplanations,
  shuffledOptions,
  isReviewMode,
  showInstantFeedback,
  onPrev,
  onNext,
  onFinish,
  total,
  answered: answeredProp, // Destructure answered as answeredProp
  ...props
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
    q && typeof q === 'object' && q.question && Array.isArray(q.options)
      ? q
      : { question: 'No questions available', options: ['N/A'], correctAnswer: 'N/A', id: 'empty' };

  // DEBUG: Expose question object for E2E
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.__LAST_QUIZ_QUESTION__ = safeQ;
  }

  // Sanitize question text to remove any repeated 'Topic' at the start (e.g., 'TopicTopic', 'Topic Topic', etc.)
  let sanitizedText = safeQ.question;
  if (typeof sanitizedText === 'string') {
    const before = sanitizedText;
    sanitizedText = sanitizedText.replace(/^(topic)+/i, 'Topic'); // Remove any number of 'topic' at the start
    sanitizedText = sanitizedText.replace(/^(Topic\s*)+/i, 'Topic '); // Remove repeated 'Topic' with spaces
    sanitizedText = sanitizedText.replace(/^\s+/, ''); // Remove leading whitespace
    if (before !== sanitizedText) {
      // console.log('[QuizQuestionCard] Sanitized question text:', { before, after: sanitizedText });
    }
  }

  // Use the answered prop directly
  const answered = answeredProp;

  // Fallback: focus the first radio input after mount if on the first question or after quiz restart
  React.useEffect(() => {
    // Only run if on the first question and not in review mode
    if (current === 0 && !isReviewMode) {
      // Wait for the DOM to update after quiz start/reset
      setTimeout(() => {
        // Find the first enabled radio input for the current question
        const firstRadio = document.querySelector('input[type="radio"][data-testid="quiz-radio"]:not([disabled])') as HTMLInputElement | null;
        if (firstRadio) {
          firstRadio.focus();
        }
      }, 0);
    }
  }, [current, isReviewMode, q]);

  return (
    <div data-testid="quiz-question-card">
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ fontWeight: 600, marginBottom: 8 }}>{sanitizedText}</legend>
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
            const safeQuestionId = safeQ.id || (safeQ.question ? safeQ.question.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) : current);
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
                  disabled={props.disableAllOptions || (answered ? true : false)}
                  onSelect={() => {
                    // Only select, do not submit
                    if (!answered) handleAnswer(i, false);
                  }}
                  onSubmitOption={() => {
                    // Only submit if this option is already selected and not answered
                    if (!answered && userAnswers[current] === i) handleAnswer(i, true);
                  }}
                  className={optionClass}
                  inputId={inputId}
                  name={name}
                  autoFocus={current === 0 && i === 0}
                  isFirst={i === 0}
                  data-testid="quiz-option"
                >
                  {/* Bookmark and error buttons can be slotted here if needed */}
                </QuizOption>
              </li>
            );
          })}
        </ul>
      </fieldset>
      {/* Feedback: render the feedback div only when answered and (showInstantFeedback || isReviewMode) are true */}
      {answered && (showInstantFeedback || isReviewMode) && (
        <div
          data-testid="quiz-feedback"
          className="quiz-feedback"
          style={{
            color: answerFeedback && answerFeedback.trim() !== ''
              ? (answerFeedback.trim() === 'Correct!' ? '#059669' : '#ef4444')
              : undefined,
            marginTop: 8,
            fontSize: 15,
            minHeight: 20,
          }}
        >
          {answerFeedback && answerFeedback.trim() !== '' ? answerFeedback : ''}
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
        onPrev={onPrev}
        onNext={onNext}
        onFinish={onFinish}
        current={current}
        total={total}
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
