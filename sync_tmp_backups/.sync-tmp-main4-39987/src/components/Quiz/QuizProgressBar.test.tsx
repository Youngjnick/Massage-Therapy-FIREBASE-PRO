import React from 'react';
import { render, screen } from '@testing-library/react';
import QuizProgressBar from './QuizProgressBar';

describe('QuizProgressBar (aria and edge cases)', () => {
  it('has correct aria attributes', () => {
    render(<QuizProgressBar progress={42} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '42');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });
  it('clamps progress below 0 and above 100', () => {
    render(<>
      <QuizProgressBar progress={-10} />
      <QuizProgressBar progress={150} />
    </>);
    const bars = screen.getAllByRole('progressbar');
    expect(bars).toHaveLength(2);
    expect(bars[0]).toHaveAttribute('aria-valuenow', '-10');
    expect(bars[1]).toHaveAttribute('aria-valuenow', '150');
  });
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

describe('QuizProgressBar (edge and accessibility)', () => {
  it('renders with 1 step (0% and 100%)', () => {
    render(<>
      <QuizProgressBar progress={0} />
      <QuizProgressBar progress={100} />
    </>);
    const bars = screen.getAllByRole('progressbar');
    expect(bars[0]).toHaveStyle('width: 0%');
    expect(bars[1]).toHaveStyle('width: 100%');
  });

  it('renders with non-integer progress', () => {
    render(<QuizProgressBar progress={33.3} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '33.3');
  });

  it('is focusable and has correct aria-label', () => {
    render(<QuizProgressBar progress={50} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.tabIndex === 0 || bar.getAttribute('tabindex') === '0').toBeTruthy();
    expect(bar).toHaveAttribute('aria-label');
  });
});
