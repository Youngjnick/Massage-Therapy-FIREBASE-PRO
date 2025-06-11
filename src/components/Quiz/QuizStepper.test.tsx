import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuizStepper from './QuizStepper';

describe('QuizStepper', () => {
  it('renders correct number of dots', () => {
    render(<QuizStepper total={5} current={2} answered={[false, true, false, false, false]} onStep={() => {}} />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });
  it('highlights the current step', () => {
    render(<QuizStepper total={3} current={1} answered={[false, false, false]} onStep={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[1]).toHaveClass('active');
  });
  it('calls onStep with correct index', () => {
    const onStep = jest.fn();
    render(<QuizStepper total={4} current={0} answered={[false, false, false, false]} onStep={onStep} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[2]);
    expect(onStep).toHaveBeenCalledWith(2);
  });
});
