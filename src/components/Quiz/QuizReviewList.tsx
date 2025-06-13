import React from 'react';

interface QuizReviewListProps {
  reviewQueue: number[];
  activeQuestions: any[];
  userAnswers: number[];
  shuffledOptions: { [key: number]: string[] };
}

const QuizReviewList: React.FC<QuizReviewListProps> = ({
  reviewQueue,
  activeQuestions,
  userAnswers,
  shuffledOptions,
}) => {
  if (reviewQueue.length === 0) return <div>No questions to review.</div>;
  return (
    <>
      {reviewQueue.map((qi) => {
        const question = activeQuestions[qi];
        const userAnswer = userAnswers[qi];
        return (
          <div key={qi} className="review-question">
            <div>
              <strong>Question {qi + 1}:</strong> {question.text}
            </div>
            <div className="review-options">
              {(shuffledOptions[qi] || question.options || []).map((opt, i) => (
                <div key={i} className={`review-option ${userAnswer === i ? 'selected' : ''}`}>
                  {opt} {i === (shuffledOptions[qi] || question.options || []).indexOf(question.correctAnswer) ? '(Correct)' : ''}
                </div>
              ))}
            </div>
            {(question.short_explanation || question.long_explanation) && (
              <div className="review-explanation">
                <strong>Explanation:</strong> {question.short_explanation || question.long_explanation}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

export default QuizReviewList;
