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
    userAnswers: [],
    answered: false,
    handleAnswer: jest.fn(),
    optionRefs: { current: [] },
    showExplanations: false,
    shuffledOptions: { 0: ['A', 'B', 'C'] },
  };

  it('calls handleAnswer with correct args on option select and submit', () => {
    const handleAnswer = jest.fn();
    render(<QuizQuestionCard {...baseProps} handleAnswer={handleAnswer} />);
    const radios = screen.getAllByRole('radio');
    // Select second option (index 1)
    fireEvent.click(radios[1]);
    expect(handleAnswer).toHaveBeenCalledWith(1, false);
    // Submit answer with Enter
    fireEvent.keyDown(radios[1], { key: 'Enter' });
    expect(handleAnswer).toHaveBeenCalledWith(1, true);
    // Submit answer with Space
    fireEvent.keyDown(radios[1], { key: ' ' });
    expect(handleAnswer).toHaveBeenCalledWith(1, true);
  });

  it('does not call handleAnswer on Arrow key navigation', () => {
    const handleAnswer = jest.fn();
    render(<QuizQuestionCard {...baseProps} handleAnswer={handleAnswer} />);
    const radios = screen.getAllByRole('radio');
    fireEvent.keyDown(radios[0], { key: 'ArrowDown' });
    fireEvent.keyDown(radios[0], { key: 'ArrowUp' });
    expect(handleAnswer).not.toHaveBeenCalled();
  });

  it('renders navigation buttons and handles clicks', () => {
    const handleAnswer = jest.fn();
    render(<QuizQuestionCard {...baseProps} handleAnswer={handleAnswer} />);
    expect(screen.getByText('Prev')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Finish')).toBeInTheDocument();
    // Simulate navigation button clicks (no-op handlers in test)
    fireEvent.click(screen.getByText('Prev'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Finish'));
    // No assertion here, just coverage
  });
});
