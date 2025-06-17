import React from 'react';
import { render, screen } from '@testing-library/react';
import Quiz from '../pages/Quiz';

jest.mock('../hooks/useQuizData', () => ({
  useQuizData: () => ({
    questions: [],
    setQuestions: jest.fn(),
    loading: true,
    setLoading: jest.fn(),
  }),
}));

jest.mock('../hooks/useQuizState', () => ({
  useQuizState: () => ({
    started: false,
    setStarted: jest.fn(),
    showResults: false,
    setShowResults: jest.fn(),
    current: 0,
    setCurrent: jest.fn(),
    userAnswers: [],
    setUserAnswers: jest.fn(),
    shuffledQuestions: [],
    setShuffledQuestions: jest.fn(),
    shuffledOptions: {},
    setShuffledOptions: jest.fn(),
    filter: 'all',
    setFilter: jest.fn(),
    filterValue: '',
    setFilterValue: jest.fn(),
    setSort: jest.fn(),
  }),
}));

jest.mock('../hooks/useQuizToggles', () => ({
  useQuizToggles: () => [{}, jest.fn()],
}));

it('shows a spinner and Loading... message when loading', () => {
  render(<Quiz />);
  expect(screen.getByTestId('quiz-loading')).toBeInTheDocument();
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
});
