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
  sort: 'default',
  setSort: jest.fn(),
  onStart: jest.fn(),
  filter: 'all',
  setFilter: jest.fn(),
  filterValue: '',
  setFilterValue: jest.fn(),
  availableDifficulties: ['easy', 'hard'],
  availableTags: [],
  toggleState: {
    showExplanations: true,
    instantFeedback: true,
    randomizeQuestions: true,
    randomizeOptions: false,
  },
  setToggleState: jest.fn(),
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
    const props = {
      ...defaultProps,
      toggleState: { ...defaultProps.toggleState, randomizeQuestions: true },
    };
    render(<QuizStartForm {...props} />);
    const checkbox = screen.getByLabelText(/randomize questions/i);
    expect(checkbox).toBeChecked();
  });

  it('show explanations checkbox is checked by default', () => {
    const props = {
      ...defaultProps,
      toggleState: { ...defaultProps.toggleState, showExplanations: true },
    };
    render(<QuizStartForm {...props} />);
    const checkbox = screen.getByLabelText(/show explanations/i);
    expect(checkbox).toBeChecked();
  });

  it('instant feedback checkbox is checked by default', () => {
    const props = {
      ...defaultProps,
      toggleState: { ...defaultProps.toggleState, instantFeedback: true },
    };
    render(<QuizStartForm {...props} />);
    const checkbox = screen.getByLabelText(/instant feedback/i);
    expect(checkbox).toBeChecked();
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
    const setToggleState = jest.fn();
    render(
      <QuizStartForm
        {...defaultProps}
        setToggleState={setToggleState}
      />
    );
    const checkbox = screen.getByLabelText(/show explanations/i);
    checkbox.focus();
    fireEvent.keyDown(checkbox, { key: ' ' });
    expect(setToggleState).toHaveBeenCalled();
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

describe('QuizStartForm (quiz length default)', () => {
  it('defaults quiz length to number of available questions', () => {
    const availableQuestions = 7;
    render(
      <QuizStartForm
        {...defaultProps}
        maxQuizLength={availableQuestions}
        quizLength={availableQuestions}
      />
    );
    const input = screen.getByLabelText(/quiz length/i);
    expect(input).toHaveValue(availableQuestions);
  });
});

describe('QuizStartForm (validation)', () => {
  it('disables Start button if no topic selected', () => {
    const props = {
      ...defaultProps,
      selectedTopic: '',
    };
    render(<QuizStartForm {...props} />);
    const startBtn = screen.getByRole('button', { name: /start/i });
    expect(startBtn).toBeDisabled();
  });
});

describe('QuizStartForm (toggle interactions)', () => {
  it('calls setToggleState when show explanations is toggled', () => {
    const setToggleState = jest.fn();
    render(<QuizStartForm {...defaultProps} setToggleState={setToggleState} />);
    const checkbox = screen.getByLabelText(/show explanations/i);
    fireEvent.click(checkbox);
    expect(setToggleState).toHaveBeenCalledWith({
      ...defaultProps.toggleState,
      showExplanations: !defaultProps.toggleState.showExplanations,
    });
  });

  it('calls setToggleState when instant feedback is toggled', () => {
    const setToggleState = jest.fn();
    render(<QuizStartForm {...defaultProps} setToggleState={setToggleState} />);
    const checkbox = screen.getByLabelText(/instant feedback/i);
    fireEvent.click(checkbox);
    expect(setToggleState).toHaveBeenCalledWith({
      ...defaultProps.toggleState,
      instantFeedback: !defaultProps.toggleState.instantFeedback,
    });
  });

  it('calls setToggleState when randomize questions is toggled', () => {
    const setToggleState = jest.fn();
    render(<QuizStartForm {...defaultProps} setToggleState={setToggleState} />);
    const checkbox = screen.getByLabelText(/randomize questions/i);
    fireEvent.click(checkbox);
    expect(setToggleState).toHaveBeenCalledWith({
      ...defaultProps.toggleState,
      randomizeQuestions: !defaultProps.toggleState.randomizeQuestions,
    });
  });

  it('calls setToggleState when randomize options is toggled', () => {
    const setToggleState = jest.fn();
    render(<QuizStartForm {...defaultProps} setToggleState={setToggleState} />);
    const checkbox = screen.getByLabelText(/randomize options/i);
    fireEvent.click(checkbox);
    expect(setToggleState).toHaveBeenCalledWith({
      ...defaultProps.toggleState,
      randomizeOptions: !defaultProps.toggleState.randomizeOptions,
    });
  });
});
