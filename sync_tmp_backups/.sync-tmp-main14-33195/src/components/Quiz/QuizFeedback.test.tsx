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

  it('renders feedback with HTML tags as plain text', () => {
    render(<QuizFeedback show={true} feedback={'<b>Bold!</b>'} />);
    expect(screen.getByText('<b>Bold!</b>')).toBeInTheDocument();
  });

  it('renders feedback with numbers', () => {
    render(<QuizFeedback show={true} feedback={12345 as any} />);
    expect(screen.getByText('12345')).toBeInTheDocument();
  });

  it('renders feedback with whitespace only', () => {
    render(<QuizFeedback show={true} feedback={'   '} />);
    const feedbackDiv = screen.getByTestId('quiz-feedback');
    expect(feedbackDiv).toBeInTheDocument();
    expect(feedbackDiv.textContent).toBe('   ');
  });

  it('renders feedback with multiline text', () => {
    const multiline = 'Line 1\nLine 2';
    render(<QuizFeedback show={true} feedback={multiline} />);
    const feedbackDiv = screen.getByTestId('quiz-feedback');
    expect(feedbackDiv).toBeInTheDocument();
    expect(feedbackDiv.textContent).toBe('Line 1\nLine 2');
  });

  it('renders nothing when feedback is undefined', () => {
    const { container } = render(<QuizFeedback show={true} feedback={undefined as any} />);
    expect(container.textContent).toBe("");
  });

  it('renders nothing when feedback is an empty string', () => {
    const { container } = render(<QuizFeedback show={true} feedback={''} />);
    expect(container.textContent).toBe("");
  });

  it('renders boolean feedback as string', () => {
    render(<QuizFeedback show={true} feedback={true as any} />);
    expect(screen.getByText('true')).toBeInTheDocument();
  });

  it('renders object feedback as [object Object]', () => {
    render(<QuizFeedback show={true} feedback={{ foo: 'bar' } as any} />);
    expect(screen.getByText('[object Object]')).toBeInTheDocument();
  });

  it('renders array feedback as comma-separated string', () => {
    render(<QuizFeedback show={true} feedback={['a', 'b', 1] as any} />);
    expect(screen.getByText('a,b,1')).toBeInTheDocument();
  });

  it('renders nothing or throws if feedback is a React element', () => {
    // Should not render the element as feedback text
    const { container } = render(<QuizFeedback show={true} feedback={<span>Element</span> as any} />);
    // Should not find the text 'Element' as plain text
    expect(container.textContent).not.toBe('Element');
  });

  it('handles symbol feedback gracefully', () => {
    const symbol = Symbol('sym');
    render(<QuizFeedback show={true} feedback={symbol as any} />);
    // Symbol coerces to undefined string, so nothing should be rendered
    expect(screen.queryByTestId('quiz-feedback')).not.toBeInTheDocument();
  });

  it('handles function feedback gracefully', () => {
    const fn = function fn() { return 'hi'; };
    render(<QuizFeedback show={true} feedback={fn as any} />);
    // Function coerces to string with newlines/indentation, so use a matcher that ignores whitespace
    const feedbackDiv = screen.getByTestId('quiz-feedback');
    expect(feedbackDiv).toBeInTheDocument();
    expect(feedbackDiv.textContent?.replace(/\s/g, '')).toBe(fn.toString().replace(/\s/g, ''));
  });
});
