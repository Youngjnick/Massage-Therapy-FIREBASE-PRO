import React from 'react';
import { render, screen } from '@testing-library/react';
import QuizProgressBar from '../components/Quiz/QuizProgressBar';

describe('QuizProgressBar', () => {
  it('renders correct progress bar width', () => {
    render(<QuizProgressBar progress={60} />); // 3/5 = 60%
    const bar = screen.getByRole('progressbar');
    expect(bar).toBeInTheDocument();
    expect(bar).toHaveStyle('width: 60%');
  });
});
