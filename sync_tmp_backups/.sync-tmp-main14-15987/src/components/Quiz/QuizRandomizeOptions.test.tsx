import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuizRandomizeOptions from './QuizRandomizeOptions';

describe('QuizRandomizeOptions', () => {
  it('renders both checkboxes and labels', () => {
    render(
      <QuizRandomizeOptions
        randomizeQuestions={false}
        setRandomizeQuestions={() => {}}
        randomizeOptions={false}
        setRandomizeOptions={() => {}}
      />
    );
    expect(screen.getByLabelText('Randomize Questions')).toBeInTheDocument();
    expect(screen.getByLabelText('Randomize Options')).toBeInTheDocument();
  });

  it('calls setRandomizeQuestions when questions checkbox is clicked', () => {
    const setRandomizeQuestions = jest.fn();
    render(
      <QuizRandomizeOptions
        randomizeQuestions={false}
        setRandomizeQuestions={setRandomizeQuestions}
        randomizeOptions={false}
        setRandomizeOptions={() => {}}
      />
    );
    fireEvent.click(screen.getByLabelText('Randomize Questions'));
    expect(setRandomizeQuestions).toHaveBeenCalledWith(true);
  });

  it('calls setRandomizeOptions when options checkbox is clicked', () => {
    const setRandomizeOptions = jest.fn();
    render(
      <QuizRandomizeOptions
        randomizeQuestions={false}
        setRandomizeQuestions={() => {}}
        randomizeOptions={false}
        setRandomizeOptions={setRandomizeOptions}
      />
    );
    fireEvent.click(screen.getByLabelText('Randomize Options'));
    expect(setRandomizeOptions).toHaveBeenCalledWith(true);
  });
});
