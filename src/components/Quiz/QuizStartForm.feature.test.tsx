import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuizStartForm from './QuizStartForm';

describe('QuizStartForm (feature toggles)', () => {
  it('randomize questions is checked by default and toggles', () => {
    const setRandomizeQuestions = jest.fn();
    render(
      <QuizStartForm
        availableTopics={['A']}
        selectedTopic="A"
        setSelectedTopic={jest.fn()}
        quizLength={5}
        setQuizLength={jest.fn()}
        maxQuizLength={10}
        randomizeQuestions={true}
        setRandomizeQuestions={setRandomizeQuestions}
        randomizeOptions={false}
        setRandomizeOptions={jest.fn()}
        sort="default"
        setSort={jest.fn()}
        onStart={jest.fn()}
        showExplanations={true}
        setShowExplanations={jest.fn()}
        filter="all"
        setFilter={jest.fn()}
        filterValue=""
        setFilterValue={jest.fn()}
        showInstantFeedback={true}
        setShowInstantFeedback={jest.fn()}
      />
    );
    const checkbox = screen.getByLabelText(/randomize questions/i);
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(setRandomizeQuestions).toHaveBeenCalledWith(false);
  });

  it('show explanations is checked by default and toggles', () => {
    const setShowExplanations = jest.fn();
    render(
      <QuizStartForm
        availableTopics={['A']}
        selectedTopic="A"
        setSelectedTopic={jest.fn()}
        quizLength={5}
        setQuizLength={jest.fn()}
        maxQuizLength={10}
        randomizeQuestions={false}
        setRandomizeQuestions={jest.fn()}
        randomizeOptions={false}
        setRandomizeOptions={jest.fn()}
        sort="default"
        setSort={jest.fn()}
        onStart={jest.fn()}
        showExplanations={true}
        setShowExplanations={setShowExplanations}
        filter="all"
        setFilter={jest.fn()}
        filterValue=""
        setFilterValue={jest.fn()}
        showInstantFeedback={true}
        setShowInstantFeedback={jest.fn()}
      />
    );
    const checkbox = screen.getByLabelText(/show explanations/i);
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(setShowExplanations).toHaveBeenCalledWith(false);
  });

  it('instant feedback is checked by default and toggles', () => {
    const setShowInstantFeedback = jest.fn();
    render(
      <QuizStartForm
        availableTopics={['A']}
        selectedTopic="A"
        setSelectedTopic={jest.fn()}
        quizLength={5}
        setQuizLength={jest.fn()}
        maxQuizLength={10}
        randomizeQuestions={false}
        setRandomizeQuestions={jest.fn()}
        randomizeOptions={false}
        setRandomizeOptions={jest.fn()}
        sort="default"
        setSort={jest.fn()}
        onStart={jest.fn()}
        showExplanations={false}
        setShowExplanations={jest.fn()}
        filter="all"
        setFilter={jest.fn()}
        filterValue=""
        setFilterValue={jest.fn()}
        showInstantFeedback={true}
        setShowInstantFeedback={setShowInstantFeedback}
      />
    );
    const checkbox = screen.getByLabelText(/instant feedback/i);
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(setShowInstantFeedback).toHaveBeenCalledWith(false);
  });
});
