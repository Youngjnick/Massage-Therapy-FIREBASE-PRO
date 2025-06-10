import React from 'react';

interface QuizLengthInputProps {
  quizLength: number;
  setQuizLength: (len: number) => void;
  maxQuizLength: number;
}

const QuizLengthInput = ({ quizLength = 10, setQuizLength = () => {}, maxQuizLength = 100 }: QuizLengthInputProps) => {
  return (
    <input
      data-testid="quiz-length-input"
      type="number"
      min={1}
      max={maxQuizLength}
      value={quizLength}
      onChange={e => setQuizLength(Number(e.target.value))}
    />
  );
};

export default QuizLengthInput;
