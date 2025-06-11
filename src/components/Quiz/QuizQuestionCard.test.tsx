import React from 'react';
import { render, screen } from '../../utils/testUtils';
import QuizQuestionCard from './QuizQuestionCard';

describe('QuizQuestionCard', () => {
  beforeAll(() => { console.log('Starting QuizQuestionCard tests...'); });
  beforeEach(() => { console.log('Running next QuizQuestionCard test...'); });
  afterAll(() => { console.log('Finished QuizQuestionCard tests.'); });

  it('renders question text', () => {
    render(
      <QuizQuestionCard
        q={{ text: 'What is the capital of France?', options: ['Paris', 'London', 'Berlin', 'Rome'], id: '1' }}
        current={0}
        userAnswers={[]}
        answered={false}
        handleAnswer={() => {}}
        optionRefs={{ current: [] }}
        showExplanations={false}
        shuffledOptions={{ 0: ['Paris', 'London', 'Berlin', 'Rome'] }}
      />
    );
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
  });
});

describe('QuizQuestionCard (explanations/feedback)', () => {
  const baseProps = {
    q: { text: 'Q1', options: ['A', 'B'], correctAnswer: 'A', short_explanation: 'Short', long_explanation: 'Long' },
    current: 0,
    userAnswers: [0],
    answered: false,
    handleAnswer: jest.fn(),
    optionRefs: { current: [] },
    showExplanations: true,
    shuffledOptions: { 0: ['A', 'B'] },
  };
  it('renders explanations when showExplanations is true', () => {
    render(<QuizQuestionCard {...baseProps} />);
    expect(screen.getByText('Short')).toBeInTheDocument();
    expect(screen.getByText('Long')).toBeInTheDocument();
  });
  it('renders feedback only when answered', () => {
    const { rerender } = render(<QuizQuestionCard {...baseProps} answered={false} />);
    expect(screen.queryByTestId('quiz-feedback')).not.toBeInTheDocument();
    rerender(<QuizQuestionCard {...baseProps} answered={true} />);
    expect(screen.getByTestId('quiz-feedback')).toBeInTheDocument();
  });
});
