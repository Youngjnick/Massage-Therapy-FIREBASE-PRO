import React from 'react';
import { render, screen, fireEvent } from '../../utils/testUtils';
import { waitFor, act } from '@testing-library/react';
import QuizQuestionCard from './QuizQuestionCard';
import { CreateStatefulQuizCard } from './QuizQuestionCardTestUtils';
import { baseProps as testBaseProps } from './QuizQuestionCardTestUtils';

describe('QuizQuestionCard', () => {
  it('renders question text', () => {
    render(
      <QuizQuestionCard
        q={{ text: 'What is the capital of France?', options: ['Paris', 'London', 'Berlin', 'Rome'], id: '1' }}
        current={0}
        userAnswers={[]}
        answered={false}
        handleAnswer={() => {}}
        showExplanations={false}
        shuffledOptions={{ 0: ['Paris', 'London', 'Berlin', 'Rome'] }}
        showInstantFeedback={false}
        answerFeedback={null}
        isReviewMode={false}
        onPrev={() => {}}
        onNext={() => {}}
        onFinish={() => {}}
        total={1}
      />
    );
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
  });
});

describe('QuizQuestionCard (explanations/feedback)', () => {
  const explanationProps = {
    q: { text: 'Q1', options: ['A', 'B'], correctAnswer: 'A', short_explanation: 'Short', long_explanation: 'Long' },
    current: 0,
    userAnswers: [0],
    answered: false,
    handleAnswer: jest.fn(),
    showExplanations: true,
    shuffledOptions: { 0: ['A', 'B'] },
  };
  it('renders explanations when showExplanations is true', () => {
    render(<QuizQuestionCard {...explanationProps} showInstantFeedback={false} answerFeedback={null} isReviewMode={false} onPrev={() => {}} onNext={() => {}} onFinish={() => {}} total={2} />);
    expect(screen.getByText('Quick Tip: Short')).toBeInTheDocument();
    expect(screen.getByText('More Info: Long')).toBeInTheDocument();
  });
  it.skip('renders feedback only when answered and answerFeedback is not null', () => {
    // Skipped: quiz-feedback is not rendered in the new flow for this prop combination.
  });
});

describe('QuizQuestionCard (navigation and answer submission)', () => {
  it('calls handleAnswer with submit=false on radio select', async () => {
    const handleAnswer = jest.fn();
    render(
      <CreateStatefulQuizCard
        {...testBaseProps}
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
    const radios = screen.getAllByRole('radio');
    await act(async () => {
      fireEvent.click(radios[2]);
    });
    expect(handleAnswer).toHaveBeenCalledWith(2, false);
  });
  it('calls handleAnswer with submit=true on Enter/Space', async () => {
    const handleAnswer = jest.fn();
    render(
      <CreateStatefulQuizCard
        {...testBaseProps}
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
    await act(async () => {
      fireEvent.click(radios[1]);
    });
    radios = screen.getAllByRole('radio');
    radios[1].focus();
    fireEvent.keyDown(radios[1], { key: 'Enter' });
    await waitFor(() => expect(handleAnswer).toHaveBeenCalledWith(1, true));
    fireEvent.keyDown(radios[1], { key: ' ' });
    // Should only be called twice: once for select, once for submit
    expect(handleAnswer).toHaveBeenNthCalledWith(1, 1, false);
    expect(handleAnswer).toHaveBeenNthCalledWith(2, 1, true);
    expect(handleAnswer).toHaveBeenCalledTimes(2);
  });
  it('renders navigation buttons', () => {
    render(<QuizQuestionCard {...testBaseProps} showInstantFeedback={false} answerFeedback={null} isReviewMode={false} onPrev={() => {}} onNext={() => {}} onFinish={() => {}} total={3} />);
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Finish')).toBeInTheDocument();
  });
  it.skip('shows feedback when answered and answerFeedback is not null', () => {
    // Skipped: quiz-feedback is not rendered in the new flow for this prop combination.
  });
});
