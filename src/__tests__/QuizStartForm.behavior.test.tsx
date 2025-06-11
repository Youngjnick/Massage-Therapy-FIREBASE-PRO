import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuizStartForm from '../components/Quiz/QuizStartForm';

describe('QuizStartForm (explanation toggle)', () => {
  it('calls setShowExplanations when toggled', () => {
    const setShowExplanations = jest.fn();
    render(
      <QuizStartForm
        availableTopics={['A']}
        selectedTopic="A"
        setSelectedTopic={() => {}}
        quizLength={1}
        setQuizLength={() => {}}
        maxQuizLength={1}
        randomizeQuestions
        setRandomizeQuestions={() => {}}
        randomizeOptions={false}
        setRandomizeOptions={() => {}}
        sort="default"
        setSort={() => {}}
        onStart={() => {}}
        showExplanations
        setShowExplanations={setShowExplanations}
        filter="all"
        setFilter={() => {}}
        filterValue=""
        setFilterValue={() => {}}
        showInstantFeedback
        setShowInstantFeedback={() => {}}
      />
    );
    const toggle = screen.getByLabelText(/explanation/i);
    fireEvent.click(toggle);
    expect(setShowExplanations).toHaveBeenCalled();
  });
});
