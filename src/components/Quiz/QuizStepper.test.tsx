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
});
