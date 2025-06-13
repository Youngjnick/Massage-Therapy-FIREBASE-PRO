import React from 'react';

interface QuizStartFormGroupProps {
  label?: string;
  children: React.ReactNode;
}

const QuizStartFormGroup: React.FC<QuizStartFormGroupProps> = ({ label, children }) => (
  <fieldset style={{ margin: '1rem 0', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: 8 }}>
    {label && <legend style={{ fontWeight: 600 }}>{label}</legend>}
    {children}
  </fieldset>
);

export default QuizStartFormGroup;
