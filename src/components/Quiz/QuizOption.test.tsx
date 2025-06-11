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

  it('is disabled when disabled prop is true', () => {
    render(
      <QuizOption label="C" option="Option 3" selected={false} disabled={true} onSelect={jest.fn()} inputId="test-id-3" />
    );
    expect(screen.getByRole('radio')).toBeDisabled();
  });
});
