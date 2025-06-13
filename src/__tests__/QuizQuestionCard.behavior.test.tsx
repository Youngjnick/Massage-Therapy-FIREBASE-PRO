import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuizQuestionCard from '../components/Quiz/QuizQuestionCard';

describe('QuizQuestionCard (app-level quiz flow)', () => {
  const baseProps = {
    q: { text: 'Q1', options: ['A', 'B'], correctAnswer: 'A' },
    current: 0,
    userAnswers: [],
    answered: false,
    handleAnswer: jest.fn(),
    optionRefs: { current: [] },
    showExplanations: false,
    shuffledOptions: { 0: ['A', 'B'] },
    isReviewMode: false,
  };

  it('renders question and options', () => {
    render(<QuizQuestionCard {...baseProps} showInstantFeedback={false} answerFeedback={null} isReviewMode={false} />);
    expect(screen.getByText('Q1')).toBeInTheDocument();
    expect(screen.getByText('A.')).toBeInTheDocument();
    expect(screen.getByText('B.')).toBeInTheDocument();
  });

  it('calls handleAnswer with submit=false on select, true on submit (two-step flow)', () => {
    const handleAnswer = jest.fn();
    // Initial render: nothing selected
    const { rerender } = render(
      <QuizQuestionCard {...baseProps} handleAnswer={handleAnswer} showInstantFeedback={false} answerFeedback={null} isReviewMode={false} userAnswers={[]} />
    );
    const radios = screen.getAllByRole('radio');
    // Simulate selecting the second option
    fireEvent.click(radios[1]);
    expect(handleAnswer).toHaveBeenCalledWith(1, false);

    // Simulate state update: option 1 is now selected
    rerender(
      <QuizQuestionCard {...baseProps} handleAnswer={handleAnswer} showInstantFeedback={false} answerFeedback={null} isReviewMode={false} userAnswers={[1]} />
    );

    // Simulate submitting the answer with Enter
    fireEvent.keyDown(screen.getAllByRole('radio')[1], { key: 'Enter' });
    expect(handleAnswer).toHaveBeenCalledWith(1, true);

    // Simulate ArrowDown (should NOT call handleAnswer)
    handleAnswer.mockClear();
    fireEvent.keyDown(screen.getAllByRole('radio')[1], { key: 'ArrowDown' });
    expect(handleAnswer).not.toHaveBeenCalled();
  });
});
