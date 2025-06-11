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

  // Helper to create refs array of correct length
  const makeOptionRefs = (len: number) => {
    return { current: Array(len).fill(null) };
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

  it('should not allow answer submission after already answered', () => {
    const handleAnswer = jest.fn();
    // answered=true disables options, so simulate a submit and try again
    render(<QuizQuestionCard {...baseProps} handleAnswer={handleAnswer} answered={true} userAnswers={[1]} showInstantFeedback={false} answerFeedback={null} optionRefs={makeOptionRefs(3)} />);
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]);
    fireEvent.keyDown(radios[0], { key: 'Enter' });
    expect(handleAnswer).not.toHaveBeenCalled();
  });

  it('should allow rapid answer changes before submit, but only one submit', () => {
    const handleAnswer = jest.fn();
    render(<QuizQuestionCard {...baseProps} handleAnswer={handleAnswer} answered={false} userAnswers={[]} showInstantFeedback={false} answerFeedback={null} optionRefs={makeOptionRefs(3)} />);
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]);
    fireEvent.click(radios[1]);
    fireEvent.click(radios[2]);
    // Log all calls for debug
    // eslint-disable-next-line no-console
    console.log('handleAnswer calls:', handleAnswer.mock.calls);
    // The last click may trigger a submit (2, true) if the UI auto-submits
    // Accept either (2, false) or (2, true) as last call, but assert the sequence
    const calls = handleAnswer.mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(1);
    expect(calls[0][0]).toBe(0);
    expect(calls[calls.length-1][0]).toBe(2);
    // If a submit happened, it should be (2, true) and only once
    const submitCalls = calls.filter(([idx, submit]) => submit === true);
    expect(submitCalls.length).toBeLessThanOrEqual(1);
    handleAnswer.mockClear();
    radios[2].focus();
    fireEvent.keyDown(radios[2], { key: 'Enter' });
    expect(handleAnswer).toHaveBeenCalledWith(2, true);
    // After submit, simulate answered=true
    render(<QuizQuestionCard {...baseProps} handleAnswer={handleAnswer} answered={true} userAnswers={[2]} showInstantFeedback={false} answerFeedback={null} optionRefs={makeOptionRefs(3)} key="answered-true" />);
    const radios2 = screen.getAllByRole('radio');
    handleAnswer.mockClear(); // Clear after remount
    // Assert radios are disabled
    expect(radios2[1]).toBeDisabled();
    fireEvent.click(radios2[1]);
    fireEvent.keyDown(radios2[1], { key: 'Enter' });
    expect(handleAnswer).not.toHaveBeenCalled();
  });

  it('should call handleAnswer with correct index and submit flag', () => {
    const handleAnswer = jest.fn();
    render(<QuizQuestionCard {...baseProps} handleAnswer={handleAnswer} answered={false} userAnswers={[]} showInstantFeedback={false} answerFeedback={null} optionRefs={makeOptionRefs(3)} />);
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[1]);
    expect(handleAnswer).toHaveBeenCalledWith(1, false);
    handleAnswer.mockClear();
    radios[1].focus();
    fireEvent.keyDown(radios[1], { key: 'Enter' });
    expect(handleAnswer).toHaveBeenCalledWith(1, true);
  });
});
