import React from 'react';

interface QuizLengthInputProps {
  quizLength: number;
  setQuizLength: (len: number) => void;
  maxQuizLength: number;
}

const QuizLengthInput: React.FC<QuizLengthInputProps> = ({ quizLength, setQuizLength, maxQuizLength }) => (
  <label style={{ marginLeft: '1rem' }}>
    Quiz Length:
    <input
      type="number"
      min={1}
      max={maxQuizLength}
      value={quizLength}
      onChange={e => setQuizLength(Number(e.target.value))}
      style={{ width: 60, marginLeft: 4 }}
    />
  </label>
);

export default QuizLengthInput;
