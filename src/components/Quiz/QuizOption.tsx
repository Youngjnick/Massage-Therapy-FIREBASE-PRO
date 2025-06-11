import React from 'react';
import QuizOptionIndicator from './QuizOptionIndicator';

interface QuizOptionProps {
  label: string;
  option: string;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
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
  // Keyboard handler for Arrow navigation on the radio input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if ((e.key === 'ArrowDown' || e.key === 'ArrowRight') && typeof optionIndex === 'number' && typeof totalOptions === 'number') {
      e.preventDefault();
      if (optionIndex < totalOptions - 1 && onArrowSelect) {
        onArrowSelect(optionIndex + 1);
      }
    } else if ((e.key === 'ArrowUp' || e.key === 'ArrowLeft') && typeof optionIndex === 'number') {
      e.preventDefault();
      if (optionIndex > 0 && onArrowSelect) {
        onArrowSelect(optionIndex - 1);
      }
    }
  };
  return (
    <div className={`quiz-option${className ? ' ' + className : ''}`} style={{ width: '100%' }} {...rest}>
      <input
        id={inputId}
        ref={inputRef}
        type="radio"
        name={name}
        checked={selected}
        onChange={onSelect}
        onKeyDown={handleKeyDown}
        aria-label={`Option ${label}: ${option}`}
        style={{ marginRight: 12 }}
        disabled={disabled}
        tabIndex={0} // Ensure radio is tabbable
        autoFocus={autoFocus}
      />
      <label htmlFor={inputId} style={{ fontWeight: 600, marginRight: 8 }}>{label}.</label> {option}
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
