import React from 'react';
import { render, screen } from '@testing-library/react';
import QuizReviewScreen from '../components/Quiz/QuizReviewScreen';

const sampleQuestions = [
  { id: 'q1', text: 'What is A?', options: ['A', 'B', 'C'], correctAnswer: 'A', topic: 'Alpha' },
  { id: 'q2', text: 'What is B?', options: ['A', 'B', 'C'], correctAnswer: 'B', topic: 'Beta' },
];

const sampleUserAnswers = [0, 1]; // Chose 'A' for q1 (correct), 'B' for q2 (correct)
const sampleShuffledOptions = { 0: ['A', 'B', 'C'], 1: ['A', 'B', 'C'] };
const sampleToggleState = {
  showExplanations: true,
  instantFeedback: false,
  randomizeQuestions: false,
  randomizeOptions: false,
};

describe('QuizReviewScreen stats UI', () => {
  it('renders topic stats, charts, and summary with correct data', () => {
    render(
      <QuizReviewScreen
        reviewQueue={[0, 1]}
        activeQuestions={sampleQuestions}
        userAnswers={sampleUserAnswers}
        shuffledOptions={sampleShuffledOptions}
        toggleState={sampleToggleState}
      />
    );
    // Topic stats
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    // Charts and summary both render 'Accuracy by Topic'
    const accuracyLabels = screen.getAllByText(/Accuracy by Topic/i);
    expect(accuracyLabels.length).toBeGreaterThanOrEqual(2);
    // Summary
    expect(screen.getByText(/Quiz Results/i)).toBeInTheDocument();
    expect(screen.getByText(/Your score: 2 \/ 2/i)).toBeInTheDocument();
    // Per-question details (should appear at least once)
    expect(screen.getAllByText('What is A?').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('What is B?').length).toBeGreaterThanOrEqual(1);
  });

  it('shows 0 correct if user answers are all wrong', () => {
    render(
      <QuizReviewScreen
        reviewQueue={[0, 1]}
        activeQuestions={sampleQuestions}
        userAnswers={[2, 0]} // Chose 'C' for q1, 'A' for q2 (both wrong)
        shuffledOptions={sampleShuffledOptions}
        toggleState={sampleToggleState}
      />
    );
    expect(screen.getByText(/Your score: 0 \/ 2/i)).toBeInTheDocument();
    expect(screen.getByText('Alpha: 0 / 1 (0%)')).toBeInTheDocument();
    expect(screen.getByText('Beta: 0 / 1 (0%)')).toBeInTheDocument();
  });
});
