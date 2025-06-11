import React from 'react';
import { render, screen } from '@testing-library/react';
import QuizProgressBar from './QuizProgressBar';

describe('QuizProgressBar (edge cases)', () => {
  it('renders 0% progress', () => {
    render(<QuizProgressBar progress={0} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveStyle('width: 0%');
  });
  it('renders 100% progress', () => {
    render(<QuizProgressBar progress={100} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveStyle('width: 100%');
  });
});
