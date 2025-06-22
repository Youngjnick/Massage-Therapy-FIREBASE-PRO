// WIP: This component is under active development and critical testing for robustness and accessibility.
import React from 'react';
import QuizOptionIndicator from './QuizOptionIndicator';

interface QuizOptionProps {
  label: string;
  option: string;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  onSubmitOption?: () => void;
  className?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  inputId: string;
  name?: string;
  children?: React.ReactNode;
  autoFocus?: boolean;
  isFirst?: boolean; // Add this prop
}

const QuizOption: React.FC<QuizOptionProps> = ({
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
  isFirst = false,
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
          // Remove or comment out debug warning for duplicate inputId
          // console.warn(`QuizOption: Duplicate inputId detected: ${uniqueInputId}`);
        }
      }
    }
  }, [uniqueInputId]);

  // Use a fallback ref if inputRef is not provided
  const fallbackRef = React.useRef<HTMLInputElement>(null);
  const resolvedInputRef = inputRef || fallbackRef;

  React.useEffect(() => {
    // Focus the input if autoFocus is true and not disabled
    if (autoFocus && !disabled && resolvedInputRef && typeof resolvedInputRef !== 'function') {
      const ref = resolvedInputRef as React.RefObject<HTMLInputElement>;
      if (ref.current) ref.current.focus();
    }
  }, [autoFocus, disabled, resolvedInputRef]);

  // Track which keys have submitted in this focus session
  const submittedKeysRef = React.useRef<{ [key: string]: boolean }>({});

  // Reset submit keys when selection changes
  React.useEffect(() => {
    submittedKeysRef.current = {};
  }, [selected]);

  // IMPORTANT: The 'name' prop must be unique per quiz card/group.
  // Keyboard navigation (ArrowUp/Down/Left/Right) is scoped to radios with the same 'name'.
  // Helper to get the input element from ref (handles function or object ref)
  const getInputEl = () => {
    if (typeof resolvedInputRef === 'function') return null;
    return resolvedInputRef?.current || null;
  };

  // Determine tabIndex: if selected, 0; if not selected and isFirst, 0; else -1
  const tabIndex = selected || (isFirst && !disabled) ? 0 : -1;

  // Auto-focus the first visible option if none are selected (for first question)
  React.useEffect(() => {
    if (isFirst && !selected && !disabled) {
      // Only focus if no other radio in the group is selected or focused
      const el = getInputEl();
      if (!el) return;
      // Find all radios in the same group (by name)
      const groupRadios = name
        ? Array.from(document.querySelectorAll(`input[type='radio'][name='${name}']`))
        : [el];
      const anySelected = groupRadios.some(r => (r as HTMLInputElement).checked);
      const anyFocused = groupRadios.some(r => r === document.activeElement);
      if (!anySelected && !anyFocused) {
        Promise.resolve().then(() => { el.focus(); }); // Robust focus after mount
      }
    }
  }, [isFirst, selected, disabled, name]);

  return (
    <div
      className={`quiz-option${className ? ' ' + className : ''}`}
      style={{ width: '100%', cursor: disabled ? 'not-allowed' : 'pointer' }}
      {...rest}
      data-qa="quiz-option"
      onClick={() => {
        if (disabled) return;
        // Only focus input if not already focused
        const el = getInputEl();
        if (el && document.activeElement !== el) el.focus();
        // If not selected, trigger onSelect (for box click)
        if (!selected && typeof onSelect === 'function') {
          onSelect();
        } else if (selected && typeof onSubmitOption === 'function') {
          onSubmitOption();
        }
      }}
    >
      <input
        id={uniqueInputId}
        ref={resolvedInputRef}
        type="radio"
        name={name}
        checked={selected}
        onChange={e => {
          if (Boolean(disabled) || e.currentTarget.readOnly) return;
          if (!selected) {
            try { if (typeof onSelect === 'function') onSelect(); } catch { /* swallow */ }
          }
        }}
        aria-label={`Option ${labelStr}: ${optionStr}`}
        aria-checked={selected}
        aria-disabled={Boolean(disabled)}
        role="radio"
        style={{ marginRight: 12, cursor: disabled ? 'not-allowed' : 'pointer' }}
        disabled={Boolean(disabled)}
        data-disabled={Boolean(disabled)}
        tabIndex={tabIndex}
        data-quiz-radio
        data-testid="quiz-radio"
        // autoFocus={autoFocus} // Remove this line to avoid React warnings and double-focusing
        onClick={e => {
          e.stopPropagation();
          if (Boolean(disabled) || e.currentTarget.readOnly) return;
          if (selected && typeof onSubmitOption === 'function') {
            onSubmitOption();
          }
        }}
        onKeyDown={e => {
          if (Boolean(disabled) || e.currentTarget.readOnly) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!selected && typeof onSelect === 'function') {
              onSelect();
            } else if (selected && typeof onSubmitOption === 'function') {
              onSubmitOption();
            }
          }
        }}
      />
      <label htmlFor={uniqueInputId} style={{ fontWeight: 600, marginRight: 8, cursor: disabled ? 'not-allowed' : 'pointer' }}>{labelStr}.</label> {optionStr}
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
