import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuizStartForm from '../components/Quiz/QuizStartForm';

describe('QuizStartForm (explanation toggle)', () => {
  it('calls setToggleState when explanation toggle is used', () => {
    const setToggleState = jest.fn();
    const toggleState = {
      showExplanations: true,
      instantFeedback: true,
      randomizeQuestions: true,
      randomizeOptions: false,
    };
    render(
      <QuizStartForm
        availableTopics={['A']}
        selectedTopic="A"
        setSelectedTopic={() => {}}
        quizLength={1}
        setQuizLength={() => {}}
        maxQuizLength={1}
        sort="default"
        setSort={() => {}}
        onStart={() => {}}
        filter="all"
        setFilter={() => {}}
        filterValue=""
        setFilterValue={() => {}}
        toggleState={toggleState}
        setToggleState={setToggleState}
      />
    );
    const toggle = screen.getByLabelText(/explanation/i);
    fireEvent.click(toggle);
    expect(setToggleState).toHaveBeenCalled();
  });
});
