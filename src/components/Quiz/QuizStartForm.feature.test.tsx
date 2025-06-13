import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuizStartForm from './QuizStartForm';

describe('QuizStartForm (feature toggles)', () => {
  const baseProps = {
    availableTopics: ['A'],
    selectedTopic: 'A',
    setSelectedTopic: jest.fn(),
    quizLength: 5,
    setQuizLength: jest.fn(),
    maxQuizLength: 10,
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

  it('randomize questions is checked by default and toggles', () => {
    const { setToggleState } = baseProps;
    render(<QuizStartForm {...baseProps} />);
    const checkbox = screen.getByLabelText(/randomize questions/i);
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(setToggleState).toHaveBeenCalledWith(
      expect.objectContaining({ randomizeQuestions: false })
    );
  });

  it('show explanations is checked by default and toggles', () => {
    const { setToggleState } = baseProps;
    render(<QuizStartForm {...baseProps} />);
    const checkbox = screen.getByLabelText(/show explanations/i);
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(setToggleState).toHaveBeenCalledWith(
      expect.objectContaining({ showExplanations: false })
    );
  });

  it('instant feedback is checked by default and toggles', () => {
    const { setToggleState } = baseProps;
    render(<QuizStartForm {...baseProps} />);
    const checkbox = screen.getByLabelText(/instant feedback/i);
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(setToggleState).toHaveBeenCalledWith(
      expect.objectContaining({ instantFeedback: false })
    );
  });
});
