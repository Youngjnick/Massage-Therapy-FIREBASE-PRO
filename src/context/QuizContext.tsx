import React, { createContext, useContext, useState } from 'react';

interface QuizContextProps {
  started: boolean;
  setStarted: (val: boolean) => void;
  current: number;
  setCurrent: (val: number) => void;
  // Add more quiz state/actions as needed
}

const QuizContext = createContext<QuizContextProps | undefined>(undefined);

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  // Add more state as needed

  return (
    <QuizContext.Provider value={{ started, setStarted, current, setCurrent }}>
      {children}
    </QuizContext.Provider>
  );
};

export function useQuizContext() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error('useQuizContext must be used within a QuizProvider');
  return ctx;
}
