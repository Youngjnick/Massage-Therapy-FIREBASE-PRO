import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuizOption from './QuizOption';

describe('QuizOption', () => {
  beforeAll(() => { console.log('Starting QuizOption tests...'); });
  beforeEach(() => { console.log('Running next QuizOption test...'); });
  afterAll(() => { console.log('Finished QuizOption tests.'); });

  it('renders label and option', () => {
    render(
      <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={jest.fn()} inputId="test-id-1" />
    );
    expect(screen.getByText('A.')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(
      <QuizOption label="B" option="Option 2" selected={false} disabled={false} onSelect={onSelect} inputId="test-id-2" />
    );
    fireEvent.click(screen.getByRole('radio'));
    expect(onSelect).toHaveBeenCalled();
  });

  describe('QuizOption (indicators/disabled)', () => {
    it('is disabled when disabled prop is true', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={true} onSelect={() => {}} inputId="test-id-1" />
      );
      expect(screen.getByRole('radio')).toBeDisabled();
    });
    it('shows correct indicator', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-1" className="correct" />
      );
      expect(screen.getByTitle('Correct')).toBeInTheDocument();
    });
    it('shows incorrect indicator', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-1" className="incorrect" />
      );
      screen.debug(); // Debug output for troubleshooting
      expect(screen.getByTitle('Incorrect')).toBeInTheDocument();
    });
    it('shows selected indicator', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-1" className="selected" />
      );
      expect(screen.getByTitle('Selected')).toBeInTheDocument();
    });
  });
});
