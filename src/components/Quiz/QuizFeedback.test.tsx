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
    // Should not render the feedback text
    expect(container.textContent).not.toContain('Should not show');
  });

  it('renders nothing when feedback is null', () => {
    const { container } = render(<QuizFeedback show={true} feedback={null} />);
    // Should not render any feedback text
    expect(container.textContent).toBe("");
  });
});
