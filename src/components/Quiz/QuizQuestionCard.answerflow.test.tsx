import React from 'react';
import { render, screen, fireEvent } from '../../utils/testUtils';
import QuizQuestionCard from './QuizQuestionCard';

describe('QuizQuestionCard (full answer flow: click, arrow, enter)', () => {
  const baseProps = {
    q: { text: 'Q2', options: ['Alpha', 'Beta', 'Gamma'], correctAnswer: 'Beta' },
    current: 0,
    userAnswers: [],
    answered: false,
    handleAnswer: jest.fn(),
    optionRefs: { current: [] },
    showExplanations: false,
    shuffledOptions: { 0: ['Alpha', 'Beta', 'Gamma'] },
  };

  it('allows selecting with click, arrow keys, and submitting with Enter', () => {
    const handleAnswer = jest.fn();
    render(<QuizQuestionCard {...baseProps} handleAnswer={handleAnswer} showInstantFeedback={false} answerFeedback={null} />);
    const radios = screen.getAllByRole('radio');
    // Click second option
    fireEvent.click(radios[1]);
    expect(handleAnswer).toHaveBeenCalledWith(1, false);
    handleAnswer.mockClear();
    // Focus third option and submit with Enter
    radios[2].focus();
    fireEvent.keyDown(radios[2], { key: 'Enter' });
    expect(handleAnswer).toHaveBeenCalledWith(2, true);
    handleAnswer.mockClear();
    // Arrow keys should NOT submit
    radios[0].focus();
    fireEvent.keyDown(radios[0], { key: 'ArrowDown' });
    fireEvent.keyDown(radios[0], { key: 'ArrowUp' });
    expect(handleAnswer).not.toHaveBeenCalled();
  });
});
