/* eslint-disable react/prop-types */
import React from 'react';
import QuizQuestionCard from './QuizQuestionCard';
import { jest } from '@jest/globals';

// Patch: add propTypes stubs to silence prop-types lint errors in test helpers
QuizQuestionCard.propTypes = QuizQuestionCard.propTypes || {};
QuizQuestionCard.propTypes.handleAnswer = () => null;
QuizQuestionCard.propTypes.q = () => null;
QuizQuestionCard.propTypes.current = () => null;
QuizQuestionCard.propTypes.shuffledOptions = () => null;

/**
 * Base props for QuizQuestionCard tests. Use as a default and override as needed.
 */
export const baseProps = {
  q: { text: 'Q1', options: ['A', 'B', 'C'], correctAnswer: 'B', id: 'q1' },
  current: 0,
  userAnswers: [],
  answered: false,
  handleAnswer: jest.fn(),
  showExplanations: false,
  shuffledOptions: { 0: ['A', 'B', 'C'] },
};

/**
 * A stateful QuizQuestionCard wrapper for RTL tests. Use for most answer flow and navigation tests.
 * @param props Partial props to override baseProps. Pass a handleAnswer to spy on answer events.
 * @returns A React component to render in tests.
 */
export function makeWrapper(props: any = {}) {
  return function Wrapper() {
    // Initialize userAnswers to [] for no selection on first render
    const [userAnswers, setUserAnswers] = React.useState<number[]>([]);
    const [answered, setAnswered] = React.useState(false);
    // Use useCallback to ensure stable function identity
    const handleAnswer = React.useCallback((idx: number, submit?: boolean) => {
      if (!submit) {
        setUserAnswers([idx]);
        setAnswered(false); // Always reset answered to false on selection
      }
      if (submit) setAnswered(true); // Only set answered to true on submit
      (props as any).handleAnswer?.(idx, submit);
    }, [props]);
    return (
      <QuizQuestionCard
        q={(props as any).q ?? baseProps.q}
        current={0}
        userAnswers={userAnswers}
        answered={answered}
        handleAnswer={handleAnswer}
        showInstantFeedback={false}
        answerFeedback={null}
        isReviewMode={false}
        showExplanations={false}
        shuffledOptions={{ 0: ['A', 'B', 'C'] }}
        {...(props as any)}
      />
    );
  };
}

/**
 * Create a stateful QuizQuestionCard directly (not as a wrapper), for advanced test composition.
 * @param props All props for QuizQuestionCard, with state managed externally.
 * @returns A QuizQuestionCard element.
 */
export function CreateStatefulQuizCard(props: React.ComponentProps<typeof QuizQuestionCard>) {
  const [userAnswers, setUserAnswers] = React.useState<number[]>(props.userAnswers ?? []);
  const [answered, setAnswered] = React.useState(props.answered ?? false);
  const handleAnswer = (idx: number, submit?: boolean) => {
    if (!submit) {
      setUserAnswers([idx]);
      setAnswered(false); // Always reset answered to false on selection
    }
    if (submit) setAnswered(true); // Only set answered to true on submit
    if (typeof props.handleAnswer === 'function') props.handleAnswer(idx, submit);
  };
  return (
    <QuizQuestionCard
      {...props}
      userAnswers={userAnswers}
      answered={answered}
      handleAnswer={handleAnswer}
    />
  );
}

// Note: This file is the single source of test helpers for QuizQuestionCard. Import from here in all related test files.
