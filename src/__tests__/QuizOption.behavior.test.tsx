import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuizOption from '../components/Quiz/QuizOption';

describe('QuizOption (keyboard/mouse answer selection)', () => {
  it('calls onSelect on radio selection (not Arrow keys)', () => {
    const onSelect = jest.fn();
    render(
      <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} inputId="test-id-1" />
    );
    const radio = screen.getByRole('radio');
    fireEvent.click(radio); // Use click instead of change
    expect(onSelect).toHaveBeenCalled();
  });

  it('does NOT call onSelect on Arrow key navigation', () => {
    const onSelect = jest.fn();
    render(
      <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={onSelect} inputId="test-id-1" />
    );
    const radio = screen.getByRole('radio');
    fireEvent.keyDown(radio, { key: 'ArrowDown' });
    fireEvent.keyDown(radio, { key: 'ArrowUp' });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it.skip('calls onSubmitOption on click', () => {
    // Skipped: In the new two-step flow, click only selects, does not submit.
  });

  it('calls onSubmitOption on Enter/Space, not Arrow keys', () => {
    const onSubmitOption = jest.fn();
    render(
      <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={() => {}} onSubmitOption={onSubmitOption} inputId="test-id-1" />
    );
    const radio = screen.getByRole('radio');
    fireEvent.keyDown(radio, { key: 'Enter' });
    fireEvent.keyDown(radio, { key: ' ' });
    fireEvent.keyDown(radio, { key: 'ArrowDown' });
    fireEvent.keyDown(radio, { key: 'ArrowUp' });
    expect(onSubmitOption).toHaveBeenCalledTimes(2); // Only Enter/Space
  });
});
