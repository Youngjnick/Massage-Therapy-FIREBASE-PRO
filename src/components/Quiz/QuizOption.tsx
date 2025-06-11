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
  ...rest
}) => {
  const classList = className.split(' ');
  return (
    <div className={`quiz-option${className ? ' ' + className : ''}`} style={{ width: '100%' }} {...rest}>
      <input
        id={inputId}
        ref={inputRef}
        type="radio"
        name={name}
        checked={selected}
        onChange={e => {
          if (disabled || e.currentTarget.readOnly) return;
          try {
            onSelect();
          } catch {
            // Swallow error to prevent crash
          }
          if (onSubmitOption) {
            try {
              onSubmitOption();
            } catch {
              // Swallow error to prevent crash
            }
          }
        }}
        aria-label={`Option ${label}: ${option}`}
        style={{ marginRight: 12 }}
        disabled={disabled}
        tabIndex={0}
        data-quiz-radio
        autoFocus={autoFocus}
        onKeyDown={e => {
          if (disabled || e.currentTarget.readOnly) return;
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            return;
          }
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (onSubmitOption) {
              try {
                onSubmitOption();
              } catch {
                // Swallow error to prevent crash
              }
            }
          }
        }}
      />
      <label htmlFor={inputId} style={{ fontWeight: 600, marginRight: 8, cursor: 'pointer' }}>{label}.</label> {option}
      <QuizOptionIndicator
        isCorrect={classList.includes('correct')}
        isIncorrect={classList.includes('incorrect')}
        isSelected={classList.includes('selected')}
      />
      {children}
    </div>
  );
};

export default QuizOption;
