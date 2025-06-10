import React from 'react';

interface QuizOptionProps {
  label: string;
  option: string;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  className?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
  children?: React.ReactNode;
}

const QuizOption: React.FC<QuizOptionProps> = ({
  label,
  option,
  selected,
  disabled,
  onSelect,
  className = '',
  inputRef,
  children,
}) => (
  <label className={`quiz-option${className ? ' ' + className : ''}`} style={{ width: '100%' }}>
    <input
      ref={inputRef}
      type="radio"
      checked={selected}
      onChange={onSelect}
      aria-label={`Option ${label}: ${option}`}
      style={{ marginRight: 12 }}
      disabled={disabled}
    />
    <span style={{ fontWeight: 600, marginRight: 8 }}>{label}.</span> {option}
    {children}
  </label>
);

export default QuizOption;
