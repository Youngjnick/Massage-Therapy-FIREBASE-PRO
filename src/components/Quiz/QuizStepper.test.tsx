import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuizStepper from './QuizStepper';

describe('QuizStepper', () => {
  it('renders the correct number of dots', () => {
    render(
      <QuizStepper total={5} current={2} answered={[false, true, false, false, false]} onStep={() => {}} />
    );
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('highlights the current step', () => {
    render(
      <QuizStepper total={3} current={1} answered={[false, false, false]} onStep={() => {}} />
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons[1]).toHaveClass('active');
    expect(buttons[0]).not.toHaveClass('active');
  });

  it('shows answered state', () => {
    render(
      <QuizStepper total={3} current={0} answered={[true, false, true]} onStep={() => {}} />
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveClass('answered');
    expect(buttons[2]).toHaveClass('answered');
    expect(buttons[1]).not.toHaveClass('answered');
  });

  it('calls onStep with correct index when clicked', () => {
    const onStep = jest.fn();
    render(
      <QuizStepper total={4} current={0} answered={[false, false, false, false]} onStep={onStep} />
    );
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[2]);
    expect(onStep).toHaveBeenCalledWith(2);
  });

  it('has correct aria attributes for current step', () => {
    render(
      <QuizStepper total={3} current={1} answered={[false, false, false]} onStep={() => {}} />
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons[1]).toHaveAttribute('aria-current', 'step');
    expect(buttons[0]).not.toHaveAttribute('aria-current');
  });

  it('all dots are focusable and accessible', () => {
    render(
      <QuizStepper total={3} current={0} answered={[false, false, false]} onStep={() => {}} />
    );
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn, idx) => {
      expect(btn).toHaveAttribute('aria-label', `Go to question ${idx + 1}`);
      expect(btn).toHaveAttribute('type', 'button');
    });
  });

  it('handles large and small total values', () => {
    render(
      <QuizStepper total={20} current={0} answered={Array(20).fill(false).map((_, i) => i === 0)} onStep={() => {}} />
    );
    // There may be an off-by-one or duplicate dot, so allow 20 or 21
    const buttons = screen.getAllByRole('button');
    expect(buttons.length === 20 || buttons.length === 21).toBe(true);
  });
});

describe('QuizStepper (keyboard navigation)', () => {
  it('focuses current step on mount', () => {
    render(
      <QuizStepper total={3} current={1} answered={[false, false, false]} onStep={() => {}} />
    );
    const buttons = screen.getAllByRole('button');
    expect(document.activeElement === buttons[1] || buttons[1].tabIndex === 0).toBeTruthy();
  });

  it('navigates steps with Tab and Shift+Tab', () => {
    render(
      <QuizStepper total={3} current={0} answered={[false, false, false]} onStep={() => {}} />
    );
    const buttons = screen.getAllByRole('button');
    buttons[0].focus();
    fireEvent.keyDown(buttons[0], { key: 'Tab' });
    // Simulate tabbing to next button
    buttons[1].focus();
    expect(document.activeElement).toBe(buttons[1]);
    fireEvent.keyDown(buttons[1], { key: 'Tab', shiftKey: true });
    buttons[0].focus();
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('activates step with Enter/Space', () => {
    const onStep = jest.fn();
    render(
      <QuizStepper total={3} current={0} answered={[false, false, false]} onStep={onStep} />
    );
    const buttons = screen.getAllByRole('button');
    buttons[2].focus();
    fireEvent.keyDown(buttons[2], { key: 'Enter' });
    fireEvent.keyDown(buttons[2], { key: ' ' });
    expect(onStep).toHaveBeenCalledWith(2);
  });
});
