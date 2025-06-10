import React from 'react';

interface QuizCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  style?: React.CSSProperties;
}

const QuizCheckbox: React.FC<QuizCheckboxProps> = ({ label, checked, onChange, style }) => (
  <label style={style}>
    <input
      type="checkbox"
      checked={checked}
      onChange={e => onChange(e.target.checked)}
    />{' '}
    {label}
  </label>
);

export default QuizCheckbox;
