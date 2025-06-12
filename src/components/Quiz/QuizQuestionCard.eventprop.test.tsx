import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuizQuestionCard from './QuizQuestionCard';

describe('QuizQuestionCard (event propagation, focus, and CSS)', () => {
  const baseProps = {
    q: { text: 'Q1', options: ['A', 'B', 'C'], correctAnswer: 'B', id: 'q1' },
    current: 0,
    userAnswers: [],
    answered: false,
    handleAnswer: jest.fn(),
    showExplanations: false,
    shuffledOptions: { 0: ['A', 'B', 'C'] },
  };

  it('focuses first option after render', () => {
    render(<QuizQuestionCard {...baseProps} showInstantFeedback={false} answerFeedback={null} isReviewMode={false} />);
    const radios = screen.getAllByRole('radio');
    expect(radios[0]).toHaveFocus();
  });

  it('calls handleAnswer on click and Enter, not on Arrow keys', () => {
    const handleAnswer = jest.fn();
    render(<QuizQuestionCard {...baseProps} handleAnswer={handleAnswer} showInstantFeedback={false} answerFeedback={null} isReviewMode={false} />);
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[1]);
    expect(handleAnswer).toHaveBeenCalledWith(1, false);
    handleAnswer.mockClear();
    radios[2].focus();
    fireEvent.keyDown(radios[2], { key: 'Enter' });
    expect(handleAnswer).toHaveBeenCalledWith(2, true);
    handleAnswer.mockClear();
    fireEvent.keyDown(radios[2], { key: 'ArrowDown' });
    fireEvent.keyDown(radios[2], { key: 'ArrowUp' });
    expect(handleAnswer).not.toHaveBeenCalled();
  });

  it('applies correct CSS classes for selected and disabled', () => {
    // Selected
    const { unmount } = render(<QuizQuestionCard {...baseProps} userAnswers={[1]} answered={false} showInstantFeedback={false} answerFeedback={null} isReviewMode={false} />);
    const radios = screen.getAllByRole('radio');
    expect(radios[1].parentElement?.className).toMatch(/selected/);
    // Disabled
    unmount();
    render(<QuizQuestionCard {...baseProps} userAnswers={[1]} answered={true} showInstantFeedback={false} answerFeedback={null} isReviewMode={false} />);
    const radios2 = screen.getAllByRole('radio');
    expect(radios2[0]).toBeDisabled();
    expect(radios2[1]).toBeDisabled();
    expect(radios2[2]).toBeDisabled();
  });
});
