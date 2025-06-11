import React from 'react';

interface QuizLengthInputProps {
  quizLength: number;
  setQuizLength: (len: number) => void;
  maxQuizLength: number;
  id?: string;
}

const QuizLengthInput = ({ quizLength = 10, setQuizLength = () => {}, maxQuizLength = 100, id }: QuizLengthInputProps) => {
  return (
    <input
      data-testid="quiz-length-input"
      id={id}
      type="number"
      min={1}
      max={maxQuizLength}
      value={quizLength}
      onChange={e => setQuizLength(Number(e.target.value))}
    />
  );
};

export default QuizLengthInput;
