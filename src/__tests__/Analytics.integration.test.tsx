import React from 'react';
import { render, screen } from '@testing-library/react';
import Analytics from '../pages/Analytics';

describe('Analytics integration', () => {
  it('displays user stats: quizzes taken, correct answers, accuracy, streak, badges', async () => {
    render(<Analytics />);
    expect(await screen.findByText(/Quizzes Taken:/)).toBeInTheDocument();
    expect(screen.getByText(/Correct Answers:/)).toBeInTheDocument();
    expect(screen.getByText(/Accuracy:/)).toBeInTheDocument();
    expect(screen.getByText(/Current Streak:/)).toBeInTheDocument();
    expect(screen.getByText(/Badges Earned:/)).toBeInTheDocument();
  });
});
