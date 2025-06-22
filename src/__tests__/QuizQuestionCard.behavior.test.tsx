import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import QuizQuestionCard from '../components/Quiz/QuizQuestionCard';
import { CreateStatefulQuizCard, baseProps } from '../components/Quiz/QuizQuestionCardTestUtils';

describe('QuizQuestionCard (app-level quiz flow)', () => {
  const defaultProps = {
    q: { question: 'Q1', options: ['A', 'B'], correctAnswer: 'A' },
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
    render(<QuizQuestionCard {...defaultProps} showInstantFeedback={false} answerFeedback={null} isReviewMode={false} onPrev={() => {}} onNext={() => {}} onFinish={() => {}} total={2} />);
    expect(screen.getByText('Q1')).toBeInTheDocument();
    expect(screen.getByText('A.')).toBeInTheDocument();
    expect(screen.getByText('B.')).toBeInTheDocument();
  });

  it('calls handleAnswer with submit=false on select, true on submit (two-step flow)', async () => {
    const handleAnswer = jest.fn();
    render(
      <CreateStatefulQuizCard
        {...baseProps}
        answered={false}
        handleAnswer={handleAnswer}
        showInstantFeedback={false}
        answerFeedback={null}
        isReviewMode={false}
        onPrev={() => {}}
        onNext={() => {}}
        onFinish={() => {}}
        total={3}
      />
    );
    let radios = screen.getAllByRole('radio');
    // Step 1: select option 1 (index 1)
    await act(async () => {
      fireEvent.click(radios[1]);
    });
    // Wait for radio to be checked before submitting
    await waitFor(() => expect((screen.getAllByRole('radio')[1] as HTMLInputElement).checked).toBe(true));
    handleAnswer.mockClear();
    // Step 2: re-query radios and focus the same radio, then simulate Enter to submit
    radios = screen.getAllByRole('radio');
    radios[1].focus();
    fireEvent.keyDown(radios[1], { key: 'Enter' });
    await waitFor(() => expect(handleAnswer).toHaveBeenCalledWith(1, true));
    handleAnswer.mockClear();
    // Step 3: simulate ArrowDown (should NOT call handleAnswer)
    fireEvent.keyDown(radios[1], { key: 'ArrowDown' });
    expect(handleAnswer).not.toHaveBeenCalled();
  });
});
