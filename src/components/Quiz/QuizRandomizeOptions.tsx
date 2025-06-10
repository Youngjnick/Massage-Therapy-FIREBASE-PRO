import React from 'react';

interface QuizRandomizeOptionsProps {
  randomizeQuestions: boolean;
  setRandomizeQuestions: (val: boolean) => void;
  randomizeOptions: boolean;
  setRandomizeOptions: (val: boolean) => void;
}

const QuizRandomizeOptions: React.FC<QuizRandomizeOptionsProps> = ({
  randomizeQuestions,
  setRandomizeQuestions,
  randomizeOptions,
  setRandomizeOptions,
}) => (
  <>
    <label style={{ marginLeft: '1rem' }}>
      <input
        type="checkbox"
        checked={randomizeQuestions}
        onChange={e => setRandomizeQuestions(e.target.checked)}
      />{' '}
      Randomize Questions
    </label>
    <label style={{ marginLeft: '1rem' }}>
      <input
        type="checkbox"
        checked={randomizeOptions}
        onChange={e => setRandomizeOptions(e.target.checked)}
      />{' '}
      Randomize Options
    </label>
  </>
);

export default QuizRandomizeOptions;
