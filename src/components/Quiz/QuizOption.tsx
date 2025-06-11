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
  onSubmitOption,
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

  // Use inputId as provided, do not append qid from name
  const uniqueInputId = inputId;

  // Warn in dev if duplicate inputId is detected (simple global check)
  React.useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ) {
      const el = document.getElementById(uniqueInputId);
      if (el) {
        // Check if there is more than one element with this id
        const all = document.querySelectorAll(`#${CSS.escape(uniqueInputId)}`);
        if (all.length > 1) {
          console.warn(`QuizOption: Duplicate inputId detected: ${uniqueInputId}`);
        }
      }
    }
  }, [uniqueInputId]);

  return (
    <div className={`quiz-option${className ? ' ' + className : ''}`} style={{ width: '100%' }} {...rest} data-qa="quiz-option" data-testid={dataTestId}>
      <input
        id={uniqueInputId}
        ref={inputRef}
        type="radio"
        name={name}
        checked={selected}
        onChange={e => {
          if (disabled || e.currentTarget.readOnly) return;
          try {
            if (typeof onSelect === 'function') onSelect();
          } catch (err) {
            console.error(err);
          }
          try {
            if (typeof onSubmitOption === 'function') onSubmitOption();
          } catch (err) {
            console.error(err);
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
              } catch (err) {
                console.error(err);
              }
            }
          }
        }}
      />
      <label htmlFor={uniqueInputId} style={{ fontWeight: 600, marginRight: 8, cursor: 'pointer' }}>{labelStr}.</label> {optionStr}
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
