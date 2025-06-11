import React from 'react';
import { render, screen, fireEvent } from '../../utils/testUtils';
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

describe('QuizQuestionCard (navigation and answer submission)', () => {
  const baseProps = {
    q: { text: 'Q1', options: ['A', 'B', 'C'], correctAnswer: 'B' },
    current: 0,
    userAnswers: [1],
    answered: false,
    handleAnswer: jest.fn(),
    optionRefs: { current: [] },
    showExplanations: false,
    shuffledOptions: { 0: ['A', 'B', 'C'] },
  };
  it('calls handleAnswer with submit=false on radio select', () => {
    const handleAnswer = jest.fn();
    render(<QuizQuestionCard {...baseProps} handleAnswer={handleAnswer} />);
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[2]);
    expect(handleAnswer).toHaveBeenCalledWith(2, false);
  });
  it('calls handleAnswer with submit=true on Enter/Space', () => {
    const handleAnswer = jest.fn();
    render(<QuizQuestionCard {...baseProps} handleAnswer={handleAnswer} />);
    const radios = screen.getAllByRole('radio');
    radios[1].focus();
    fireEvent.keyDown(radios[1], { key: 'Enter' });
    fireEvent.keyDown(radios[1], { key: ' ' });
    expect(handleAnswer).toHaveBeenCalledWith(1, true);
  });
  it('renders navigation buttons', () => {
    render(<QuizQuestionCard {...baseProps} />);
    expect(screen.getByText('Prev')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Finish')).toBeInTheDocument();
  });
  it('shows feedback when answered', () => {
    render(<QuizQuestionCard {...baseProps} answered={true} />);
    expect(screen.getByTestId('quiz-feedback')).toBeInTheDocument();
  });
});
