import { useState } from 'react';

export type QuizToggleState = {
  showExplanations: boolean;
  instantFeedback: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
};

const defaultToggleState: QuizToggleState = {
  showExplanations: true,
  instantFeedback: true,
  randomizeQuestions: true,
  randomizeOptions: false,
};

export function useQuizToggles(initialState?: Partial<QuizToggleState>) {
  const [toggleState, setToggleState] = useState<QuizToggleState>({
    ...defaultToggleState,
    ...initialState,
  });
  return [toggleState, setToggleState] as const;
}
