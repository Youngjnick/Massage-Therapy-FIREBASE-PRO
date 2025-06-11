// WIP: This component is under active development and critical testing for robustness and accessibility.

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
  'data-testid': dataTestId,
  ...rest
}) => {
  const classList = className.split(' ');
  const labelStr = String(label);
  const optionStr = String(option);

  // Warn in dev if duplicate inputId is detected (simple global check)
  try {
    if ((typeof window !== 'undefined') && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      if (inputId && document.getElementById(inputId)) {
        console.warn(`QuizOption: Duplicate inputId detected: ${inputId}`);
      }
    }
  } catch {
    // Suppress errors in duplicate inputId dev check
  }

  return (
    <div className={`quiz-option${className ? ' ' + className : ''}`} style={{ width: '100%' }} {...rest} data-qa="quiz-option" data-testid={dataTestId}>
      <input
        id={inputId}
        ref={inputRef}
        type="radio"
        name={name}
        checked={selected}
        onChange={e => {
          if (disabled || e.currentTarget.readOnly) return;
          try {
            if (typeof onSelect === 'function') onSelect();
          } catch {
            // Swallow error to prevent crash
          }
          if (typeof onSubmitOption === 'function') {
            try {
              onSubmitOption();
            } catch {
              // Swallow error to prevent crash
            }
          }
        }}
        aria-label={`Option ${labelStr}: ${optionStr}`}
        aria-checked={selected}
        aria-disabled={disabled}
        role="radio"
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
            if (typeof onSubmitOption === 'function') {
              try {
                onSubmitOption();
              } catch {
                // Swallow error to prevent crash
              }
            }
          }
        }}
      />
      <label htmlFor={inputId} style={{ fontWeight: 600, marginRight: 8, cursor: 'pointer' }}>{labelStr}.</label> {optionStr}
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
