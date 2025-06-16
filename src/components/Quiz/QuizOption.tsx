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
  isFirst = false,
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
          // Remove or comment out debug warning for duplicate inputId
          // console.warn(`QuizOption: Duplicate inputId detected: ${uniqueInputId}`);
        }
      }
    }
  }, [uniqueInputId]);

  React.useEffect(() => {
    // Focus the input if autoFocus is true and not disabled
    if (autoFocus && !disabled && inputRef && typeof inputRef !== 'function') {
      const ref = (inputRef as React.RefObject<HTMLInputElement>);
      if (ref.current) ref.current.focus();
    }
  }, [autoFocus, disabled, inputRef]);

  // Track which keys have submitted in this focus session
  const submittedKeysRef = React.useRef<{ [key: string]: boolean }>({});

  // Reset submit keys on blur
  const handleBlur = () => {
    submittedKeysRef.current = {};
  };

  // Reset submit keys when selection changes
  React.useEffect(() => {
    submittedKeysRef.current = {};
  }, [selected]);

  // IMPORTANT: The 'name' prop must be unique per quiz card/group.
  // Keyboard navigation (ArrowUp/Down/Left/Right) is scoped to radios with the same 'name'.
  const focusSiblingInput = (direction: 'next' | 'prev') => {
    const thisInput = document.getElementById(uniqueInputId);
    if (!thisInput || !name) return;
    const radios = Array.from(document.querySelectorAll('input[type="radio"][name="' + name + '"]'))
      .map(r => r as HTMLInputElement)
      .filter(r => r.offsetParent !== null);
    const idx = radios.findIndex(r => r.id === uniqueInputId);
    if (idx === -1) return;
    const nextIdx = direction === 'next' ? (idx + 1) % radios.length : (idx - 1 + radios.length) % radios.length;
    // Debug log
    console.log('[QuizOption] focusSiblingInput:', { direction, current: uniqueInputId, next: radios[nextIdx]?.id });
    Promise.resolve().then(() => { radios[nextIdx]?.focus(); });
  };

  // Use a fallback ref if inputRef is not provided
  const fallbackRef = React.useRef<HTMLInputElement>(null);
  const resolvedInputRef = inputRef || fallbackRef;

  // Helper to get the input element from ref (handles function or object ref)
  const getInputEl = () => {
    if (typeof resolvedInputRef === 'function') return null;
    return resolvedInputRef?.current || null;
  };

  // Always set tabIndex=0 for the first enabled option, else -1
  const tabIndex = isFirst && !disabled ? 0 : selected ? 0 : -1;

  // Robustly focus the first option after quiz start/reset
  React.useEffect(() => {
    if (isFirst && !selected && !disabled) {
      const el = getInputEl();
      if (!el) return;
      // Only focus if no other radio in the group is selected or focused
      const groupRadios = name
        ? Array.from(document.querySelectorAll(`input[type='radio'][name='${name}']`))
        : [el];
      const anySelected = groupRadios.some(r => (r as HTMLInputElement).checked);
      const anyFocused = groupRadios.some(r => r === document.activeElement);
      if (!anySelected && !anyFocused) {
        window.requestAnimationFrame(() => { el.focus(); }); // Use window.rAF for robust focus after mount
      }
    }
  }, [isFirst, selected, disabled, name]);

  return (
    <div
      className={`quiz-option${className ? ' ' + className : ''}`}
      style={{ width: '100%', cursor: disabled ? 'not-allowed' : 'pointer' }}
      {...rest}
      data-qa="quiz-option"
      data-testid={dataTestId}
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
        onBlur={handleBlur}
        onKeyDown={e => {
          // Debug log for keydown
          console.log('[QuizOption] onKeyDown:', { key: e.key, id: uniqueInputId, focused: document.activeElement?.id });
          if (Boolean(disabled) || e.currentTarget.readOnly) return;
          if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            focusSiblingInput('prev');
            return;
          }
          if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            focusSiblingInput('next');
            return;
          }
          if ((e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            if (!selected) {
              try { if (typeof onSelect === 'function') onSelect(); } catch { /* swallow */ }
            } else if (!submittedKeysRef.current[e.key]) {
              submittedKeysRef.current[e.key] = true;
              try { if (typeof onSubmitOption === 'function') onSubmitOption(); } catch { /* swallow */ }
            }
            return;
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
