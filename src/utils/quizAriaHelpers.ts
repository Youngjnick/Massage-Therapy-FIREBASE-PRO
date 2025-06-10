// Accessibility/ARIA helpers for quiz UI

export function getAriaLabelForOption(label: string, option: string, isCorrect?: boolean, isIncorrect?: boolean): string {
  if (isCorrect) return `Option ${label}: ${option} (Correct)`;
  if (isIncorrect) return `Option ${label}: ${option} (Incorrect)`;
  return `Option ${label}: ${option}`;
}

export function getAriaLiveProps(type: 'polite' | 'assertive' = 'polite') {
  return {
    'aria-live': type,
    'aria-atomic': 'true',
  };
}
