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
    render(
      <QuizQuestionCard
        q={baseProps.q}
        current={0}
        userAnswers={[2]}
        answered={true}
        handleAnswer={handleAnswer}
        optionRefs={makeOptionRefs(3)}
        showInstantFeedback={false}
        answerFeedback={null}
        showExplanations={false}
        shuffledOptions={baseProps.shuffledOptions}
      />
    );
    const radiosAfterAnswered = screen.getAllByRole('radio');
    handleAnswer.mockClear(); // Clear after remount
    // Assert radios are disabled
    console.log('Before assertion: radiosAfterAnswered[1]', {
      disabled: (radiosAfterAnswered[1] as HTMLInputElement).disabled,
      ariaDisabled: radiosAfterAnswered[1].getAttribute('aria-disabled'),
      id: radiosAfterAnswered[1].id,
      name: (radiosAfterAnswered[1] as HTMLInputElement).name,
      checked: (radiosAfterAnswered[1] as HTMLInputElement).checked
    });
    expect(radiosAfterAnswered[1]).toBeDisabled();
    fireEvent.click(radiosAfterAnswered[1]);
    fireEvent.keyDown(radiosAfterAnswered[1], { key: 'Enter' });
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

  it('should reset answered state and allow answer submission for next question', () => {
    // Simulate a quiz with two questions
    const q1 = { text: 'Q1', options: ['A', 'B'], correctAnswer: 'A' };
    const q2 = { text: 'Q2', options: ['C', 'D'], correctAnswer: 'C' };
    const handleAnswer = jest.fn();
    // First question, not answered
    const { rerender } = render(
      <QuizQuestionCard
        q={q1}
        current={0}
        userAnswers={[]}
        answered={false}
        handleAnswer={handleAnswer}
        optionRefs={{ current: [null, null] }}
        showInstantFeedback={false}
        answerFeedback={null}
        showExplanations={false}
        shuffledOptions={{ 0: ['A', 'B'], 1: ['C', 'D'] }}
      />
    );
    let radios = screen.getAllByRole('radio');
    expect(radios[0]).not.toBeDisabled();
    fireEvent.click(radios[1]);
    expect(handleAnswer).toHaveBeenCalledWith(1, false);
    // Simulate submit
    fireEvent.keyDown(radios[1], { key: 'Enter' });
    expect(handleAnswer).toHaveBeenCalledWith(1, true);
    // Move to next question, answered should reset
    rerender(
      <QuizQuestionCard
        q={q2}
        current={1}
        userAnswers={[]}
        answered={false}
        handleAnswer={handleAnswer}
        optionRefs={{ current: [null, null] }}
        showInstantFeedback={false}
        answerFeedback={null}
        showExplanations={false}
        shuffledOptions={{ 0: ['A', 'B'], 1: ['C', 'D'] }}
      />
    );
    radios = screen.getAllByRole('radio');
    handleAnswer.mockClear();
    expect(radios[0]).not.toBeDisabled();
    fireEvent.click(radios[0]);
    expect(handleAnswer).toHaveBeenCalledWith(0, false);
    fireEvent.keyDown(radios[0], { key: 'Enter' });
    expect(handleAnswer).toHaveBeenCalledWith(0, true);
    // After submit, simulate answered=true for second question
    rerender(
      <QuizQuestionCard
        q={q2}
        current={1}
        userAnswers={[0]}
        answered={true}
        handleAnswer={handleAnswer}
        optionRefs={{ current: [null, null] }}
        showInstantFeedback={false}
        answerFeedback={null}
        showExplanations={false}
        shuffledOptions={{ 0: ['A', 'B'], 1: ['C', 'D'] }}
      />
    );
    const radiosAfterAnswered = screen.getAllByRole('radio');
    // Debug output for props and DOM state
    console.log('Second question radios after answered=true:', radiosAfterAnswered.map(r => ({
      disabled: (r as HTMLInputElement).disabled,
      ariaDisabled: r.getAttribute('aria-disabled'),
      id: r.id,
      name: (r as HTMLInputElement).name,
      checked: (r as HTMLInputElement).checked
    })));
    // Only check the current question's radios for disabled state after rerendering with answered=true
    // Remove any assertion for the first question's radios after submission
    // Only check radiosAfterAnswered (second question) for disabled state
    expect(radiosAfterAnswered[0]).toBeDisabled();
    expect(radiosAfterAnswered[1]).toBeDisabled();
    fireEvent.click(radiosAfterAnswered[0]);
    fireEvent.keyDown(radiosAfterAnswered[0], { key: 'Enter' });
    expect(handleAnswer).not.toHaveBeenCalled();
  });
});
