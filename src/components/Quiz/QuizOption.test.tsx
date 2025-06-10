import React from 'react';
import { render, screen, fireEvent } from '../../utils/testUtils';
import QuizOption from './QuizOption';

describe('QuizOption', () => {
  it('renders label and option', () => {
    render(
      <QuizOption label="A" option="Option 1" selected={false} disabled={false} onSelect={jest.fn()} />
    );
    expect(screen.getByText('A.')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(
      <QuizOption label="B" option="Option 2" selected={false} disabled={false} onSelect={onSelect} />
    );
    fireEvent.click(screen.getByRole('radio'));
    expect(onSelect).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <QuizOption label="C" option="Option 3" selected={false} disabled={true} onSelect={jest.fn()} />
    );
    expect(screen.getByRole('radio')).toBeDisabled();
  });
});
