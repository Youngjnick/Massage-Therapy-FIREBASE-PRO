/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';

interface QuizLengthInputProps {
  quizLength: number;
  setQuizLength: (len: number) => void;
  maxQuizLength: number;
  id?: string;
  "data-testid"?: string;
}

const QuizLengthInput = React.forwardRef<HTMLInputElement, QuizLengthInputProps>(
  ({ quizLength, setQuizLength, maxQuizLength, id, "data-testid": dataTestId }, ref) => (
    <div className="quiz-length-input">
      <label style={{ marginLeft: '1rem' }} htmlFor={id}>
        Quiz Length:
        <input
          type="number"
          min={maxQuizLength === 0 ? 0 : 1}
          max={maxQuizLength}
          value={quizLength}
          onChange={e => setQuizLength(Number(e.target.value))}
          style={{ width: 60, marginLeft: 4 }}
          id={id}
          data-testid={dataTestId}
          disabled={maxQuizLength === 0}
          aria-label="Quiz Length"
          ref={ref}
        />
      </label>
    </div>
  )
);

export default QuizLengthInput;
