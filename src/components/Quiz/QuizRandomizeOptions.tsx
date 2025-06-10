import React from 'react';

interface QuizRandomizeOptionsProps {
  randomizeQuestions: boolean;
  setRandomizeQuestions: (val: boolean) => void;
  randomizeOptions: boolean;
  setRandomizeOptions: (val: boolean) => void;
}

const QuizRandomizeOptions = ({
  randomizeQuestions = false,
  setRandomizeQuestions = () => {},
  randomizeOptions = false,
  setRandomizeOptions = () => {},
}: QuizRandomizeOptionsProps) => {
  return (
    <>
      <label>
        <input
          data-testid="quiz-randomize-questions"
          type="checkbox"
          checked={randomizeQuestions}
          onChange={e => setRandomizeQuestions(e.target.checked)}
        />
        Randomize Questions
      </label>
      <label>
        <input
          data-testid="quiz-randomize-options"
          type="checkbox"
          checked={randomizeOptions}
          onChange={e => setRandomizeOptions(e.target.checked)}
        />
        Randomize Options
      </label>
    </>
  );
};

export default QuizRandomizeOptions;
