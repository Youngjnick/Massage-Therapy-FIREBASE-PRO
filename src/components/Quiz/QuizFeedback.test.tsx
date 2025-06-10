import React from 'react';
import { render, screen } from '../../utils/testUtils';
import QuizFeedback from './QuizFeedback';

describe('QuizFeedback', () => {
  it('renders feedback when show=true and feedback is provided', () => {
    render(<QuizFeedback show={true} feedback="Correct!" />);
    expect(screen.getByText('Correct!')).toBeInTheDocument();
  });

  it('renders nothing when show=false', () => {
    const { container } = render(<QuizFeedback show={false} feedback="Should not show" />);
    expect(container.textContent).not.toContain('Should not show');
  });

  it('renders nothing when feedback is null', () => {
    const { container } = render(<QuizFeedback show={true} feedback={null} />);
    expect(container.textContent).toBe("");
  });

  it('renders nothing when show=false and feedback is null', () => {
    const { container } = render(<QuizFeedback show={false} feedback={null} />);
    expect(container.textContent).toBe("");
  });

  it('renders special characters in feedback', () => {
    render(<QuizFeedback show={true} feedback={"Great job! 🎉"} />);
    expect(screen.getByText(/Great job! 🎉/)).toBeInTheDocument();
  });

  it('renders long feedback text', () => {
    const longText = 'A'.repeat(1000);
    render(<QuizFeedback show={true} feedback={longText} />);
    expect(screen.getByText(longText)).toBeInTheDocument();
  });
});
