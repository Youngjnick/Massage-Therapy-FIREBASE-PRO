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

  describe('QuizOption (accessibility and keyboard)', () => {
    it('has correct aria attributes', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={true} disabled={false} onSelect={() => {}} inputId="test-id-1" />
      );
      const radio = screen.getByRole('radio');
      // checked radio inputs do not have aria-checked, but have checked property
      expect(radio).toBeChecked();
      expect(radio).toHaveAttribute('id', 'test-id-1');
    });
    it('calls onSubmitOption when pressing Space or Enter', () => {
      const onSubmitOption = jest.fn();
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} onSubmitOption={onSubmitOption} inputId="test-id-1" />
      );
      const radio = screen.getByRole('radio');
      radio.focus();
      fireEvent.keyDown(radio, { key: ' ' });
      fireEvent.keyDown(radio, { key: 'Enter' });
      expect(onSubmitOption).toHaveBeenCalledTimes(2);
    });
    it('does not call onSelect or onSubmitOption when disabled', () => {
      const onSelect = jest.fn();
      const onSubmitOption = jest.fn();
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={true} onSelect={onSelect} onSubmitOption={onSubmitOption} inputId="test-id-1" />
      );
      const radio = screen.getByRole('radio');
      fireEvent.click(radio);
      fireEvent.keyDown(radio, { key: ' ' });
      fireEvent.keyDown(radio, { key: 'Enter' });
      expect(onSelect).not.toHaveBeenCalled();
      expect(onSubmitOption).not.toHaveBeenCalled();
    });
    it('is focusable when not disabled', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-1" />
      );
      const radio = screen.getByRole('radio');
      radio.focus();
      expect(radio).toHaveFocus();
    });
    it('is focusable even when disabled (browser default for radio)', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={true} onSelect={() => {}} inputId="test-id-1" />
      );
      const radio = screen.getByRole('radio');
      radio.focus();
      expect(radio).toHaveFocus();
    });
  });

  describe('QuizOption (edge cases)', () => {
    it('renders with a very long option string', () => {
      const longOption = 'A'.repeat(500);
      render(
        <QuizOption label="A" option={longOption} selected={false} disabled={false} onSelect={() => {}} inputId="test-id-long" />
      );
      expect(screen.getByText(longOption)).toBeInTheDocument();
    });

    it('renders with special characters in label and option', () => {
      render(
        <QuizOption label="Ω" option={"Option & < > ' \""} selected={false} disabled={false} onSelect={() => {}} inputId="test-id-special" />
      );
      expect(screen.getByText('Ω.')).toBeInTheDocument();
      expect(screen.getByText("Option & < > ' \"")).toBeInTheDocument();
    });

    it('renders with no className and no indicator', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-no-class" />
      );
      // Should not render any indicator span
      expect(screen.queryByTitle('Correct')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Incorrect')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Selected')).not.toBeInTheDocument();
    });

    it('renders children if provided', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-child">
          <span data-testid="custom-child">Extra</span>
        </QuizOption>
      );
      expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    });

    it('handles missing optional props gracefully', () => {
      render(
        <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} inputId="test-id-minimal" />
      );
      expect(screen.getByRole('radio')).toBeInTheDocument();
    });
  });
});
