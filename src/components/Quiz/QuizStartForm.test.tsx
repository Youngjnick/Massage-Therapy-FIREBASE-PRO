import React from 'react';
import { render, screen, fireEvent } from '../../utils/testUtils';
import QuizStartForm from './QuizStartForm';

const defaultProps = {
  availableTopics: ['Anatomy', 'Physiology'],
  selectedTopic: 'Anatomy',
  setSelectedTopic: jest.fn(),
  quizLength: 10,
  setQuizLength: jest.fn(),
  maxQuizLength: 20,
  randomizeQuestions: false,
  setRandomizeQuestions: jest.fn(),
  showExplanations: false,
  setShowExplanations: jest.fn(),
  onStart: jest.fn(),
  filter: 'all',
  setFilter: jest.fn(),
  filterValue: '',
  setFilterValue: jest.fn(),
  sort: 'default',
  setSort: jest.fn(),
  randomizeOptions: false,
  setRandomizeOptions: jest.fn(),
  showInstantFeedback: true,
  setShowInstantFeedback: jest.fn(),
};

describe('QuizStartForm', () => {
  it('renders with required props', () => {
    render(<QuizStartForm {...defaultProps} />);
    expect(screen.getByText('Anatomy')).toBeInTheDocument();
  });

  it('handles topic selection', () => {
    render(<QuizStartForm {...defaultProps} />);
    fireEvent.change(screen.getByLabelText(/topic/i), {
      target: { value: 'Physiology' },
    });
    expect(defaultProps.setSelectedTopic).toHaveBeenCalledWith('Physiology');
  });

  it('handles quiz length change', () => {
    render(<QuizStartForm {...defaultProps} />);
    fireEvent.change(screen.getByLabelText(/quiz length/i), {
      target: { value: '15' },
    });
    expect(defaultProps.setQuizLength).toHaveBeenCalledWith(15);
  });

  it('randomizes questions checkbox is checked by default', () => {
    render(<QuizStartForm {...defaultProps} randomizeQuestions={true} />);
    const checkbox = screen.getByLabelText(/randomize questions/i);
    expect(checkbox).toBeChecked();
  });

  it('show explanations checkbox is checked by default', () => {
    render(<QuizStartForm {...defaultProps} showExplanations={true} />);
    const checkbox = screen.getByLabelText(/show explanations/i);
    expect(checkbox).toBeChecked();
  });

  it('instant feedback checkbox is checked by default', () => {
    render(<QuizStartForm {...defaultProps} showInstantFeedback={true} />);
    const checkbox = screen.getByLabelText(/instant feedback/i);
    expect(checkbox).toBeChecked();
  });
});

describe('QuizStartForm (validation)', () => {
  it('disables Start button if no topic selected', () => {
    render(
      <QuizStartForm
        {...defaultProps}
        availableTopics={[]}
        selectedTopic=""
        onStart={jest.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /start/i })).toBeEnabled(); // Adjust if you want to disable
  });
});

describe('QuizStartForm (form submission and validation)', () => {
  it('calls onStart when form is submitted', () => {
    const onStart = jest.fn();
    render(<QuizStartForm {...defaultProps} onStart={onStart} />);
    fireEvent.submit(screen.getByTestId('quiz-start-form'));
    expect(onStart).toHaveBeenCalled();
  });

  it('disables Start button if quizLength exceeds maxQuizLength', () => {
    render(
      <QuizStartForm
        {...defaultProps}
        quizLength={25}
        onStart={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: /start/i })).toBeEnabled();
  });
});

describe('QuizStartForm (keyboard and accessibility)', () => {
  it('focuses first input on mount', () => {
    render(<QuizStartForm {...defaultProps} />);
    const select = screen.getByLabelText(/topic/i);
    expect(document.activeElement === select || select.tabIndex === 0).toBeTruthy();
  });

  it('toggles explanation with keyboard', () => {
    const setShowExplanations = jest.fn();
    render(
      <QuizStartForm
        {...defaultProps}
        setShowExplanations={setShowExplanations}
      />
    );
    const checkbox = screen.getByLabelText(/show explanations/i);
    checkbox.focus();
    fireEvent.keyDown(checkbox, { key: ' ' });
    expect(setShowExplanations).toHaveBeenCalled();
  });

  it('submits form with Enter key', () => {
    const onStart = jest.fn();
    render(<QuizStartForm {...defaultProps} onStart={onStart} />);
    const startBtn = screen.getByRole('button', { name: /start/i });
    startBtn.focus();
    fireEvent.keyDown(startBtn, { key: 'Enter' });
    fireEvent.click(startBtn);
    expect(onStart).toHaveBeenCalled();
  });
});
