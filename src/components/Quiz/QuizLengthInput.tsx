import React from 'react';

interface QuizLengthInputProps {
  quizLength: number | '';
  setQuizLength: (_len: number | '') => void;
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
          min={1}
          max={maxQuizLength}
          value={quizLength === 0 ? '' : quizLength}
          onChange={e => {
            let val: number | '' = e.target.value === '' ? '' : Number(e.target.value);
            if (val !== '' && !isNaN(val)) {
              val = Math.max(1, Math.min(val, maxQuizLength));
            }
            setQuizLength(val);
          }}
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
QuizLengthInput.displayName = "QuizLengthInput";

export default QuizLengthInput;
