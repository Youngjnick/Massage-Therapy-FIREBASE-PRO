import React from 'react';
import QuizOptionIndicator from './QuizOptionIndicator';

interface QuizOptionProps {
  label: string;
  option: string;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  onSubmitOption?: () => void; // <-- add this
  className?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  inputId: string;
  name?: string;
  children?: React.ReactNode;
  autoFocus?: boolean;
  optionIndex?: number;
  totalOptions?: number;
  onArrowSelect?: (idx: number) => void;
}

const QuizOption: React.FC<QuizOptionProps & { 'data-testid'?: string }> = ({
  label,
  option,
  selected,
  disabled,
  onSelect,
  onSubmitOption, // <-- add this
  className = '',
  inputRef,
  inputId,
  name,
  children,
  autoFocus = false,
  optionIndex,
  totalOptions,
  onArrowSelect,
  ...rest
}) => {
  return (
    <div className={`quiz-option${className ? ' ' + className : ''}`} style={{ width: '100%' }} {...rest}>
      <input
        id={inputId}
        ref={inputRef}
        type="radio"
        name={name}
        checked={selected}
        onChange={onSelect} // Only select, do not submit
        aria-label={`Option ${label}: ${option}`}
        style={{ marginRight: 12 }}
        disabled={disabled}
        tabIndex={0}
        autoFocus={autoFocus}
        onClick={e => {
          if (!disabled && onSubmitOption) {
            onSubmitOption();
          }
        }}
        onKeyDown={e => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            if (onSubmitOption) onSubmitOption();
          }
        }}
      />
      <label htmlFor={inputId} style={{ fontWeight: 600, marginRight: 8, cursor: 'pointer' }}>{label}.</label> {option}
      <QuizOptionIndicator
        isCorrect={className.includes('correct')}
        isIncorrect={className.includes('incorrect')}
        isSelected={className.includes('selected')}
      />
      {children}
    </div>
  );
};

export default QuizOption;
