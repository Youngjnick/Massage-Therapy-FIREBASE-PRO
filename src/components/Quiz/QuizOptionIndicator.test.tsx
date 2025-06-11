import React from 'react';
import { render, screen } from '../../utils/testUtils';
import QuizOptionIndicator from './QuizOptionIndicator';

describe('QuizOptionIndicator', () => {
  beforeAll(() => {});
  beforeEach(() => {});
  afterAll(() => {});

  it('shows correct icon', () => {
    render(<QuizOptionIndicator isCorrect />);
    expect(screen.getByTitle('Correct')).toBeInTheDocument();
  });
  it('shows incorrect icon', () => {
    render(<QuizOptionIndicator isIncorrect />);
    expect(screen.getByTitle('Incorrect')).toBeInTheDocument();
  });
  it('shows selected icon', () => {
    render(<QuizOptionIndicator isSelected />);
    expect(screen.getByTitle('Selected')).toBeInTheDocument();
  });
  it('renders nothing if no props', () => {
    const { container } = render(<QuizOptionIndicator />);
    // Should not render any indicator span
    expect(container.querySelector('span')).toBeNull();
  });
});
