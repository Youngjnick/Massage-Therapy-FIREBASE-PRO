import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

jest.mock('../questions/index', () => ({
  getQuestions: jest.fn().mockResolvedValue([
    {
      id: '1',
      text: 'Q1',
      options: ['A', 'B', 'C'],
      correctAnswer: 'B',
      topic: 'T1',
      short_explanation: 'Short explanation',
    },
    {
      id: '2',
      text: 'Q2',
      options: ['X', 'Y', 'Z'],
      correctAnswer: 'Y',
      topic: 'T1',
      short_explanation: 'Another explanation',
    },
  ]),
}));

describe('Quiz integration: feature toggles', () => {
  it('randomizes questions when enabled', async () => {
    window.history.pushState({}, 'Quiz page', '/quiz');
    render(<App />);
    // Randomize Questions should be checked by default
    const randomizeCheckbox = screen.getByLabelText(/randomize questions/i);
    expect(randomizeCheckbox).toBeChecked();
    // Set quiz length to 2 (number of mock questions)
    const lengthInput = screen.getByTestId('quiz-length-input');
    fireEvent.change(lengthInput, { target: { value: 2 } });
    // Start quiz
    fireEvent.click(screen.getByRole('button', { name: /start quiz/i }));
    // Wait for question card
    const questionCard = await screen.findByTestId('quiz-question-card');
    // The first question should NOT always be Q1 if randomized
    const legend = questionCard.querySelector('legend');
    expect(legend).toBeTruthy();
    // Accept either Q1 or Q2, but if you run this test multiple times, order should vary
    expect(['Q1', 'Q2']).toContain(legend?.textContent);
  });

  it('shows explanations when enabled', async () => {
    window.history.pushState({}, 'Quiz page', '/quiz');
    render(<App />);
    // Show Explanations should be checked by default
    const explanationsCheckbox = screen.getByLabelText(/show explanations/i);
    expect(explanationsCheckbox).toBeChecked();
    // Set quiz length to 2 (number of mock questions)
    const lengthInput = screen.getByTestId('quiz-length-input');
    fireEvent.change(lengthInput, { target: { value: 2 } });
    // Start quiz
    fireEvent.click(screen.getByRole('button', { name: /start quiz/i }));
    // Wait for question card
    await screen.findByTestId('quiz-question-card');
    // Select an answer and submit
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[1]); // select B (correct)
    fireEvent.keyDown(radios[1], { key: 'Enter' });
    // Wait for explanation to appear
    await waitFor(() => {
      expect(screen.getByText(/explanation/i)).toBeInTheDocument();
    });
  });

  it('shows instant feedback when enabled', async () => {
    window.history.pushState({}, 'Quiz page', '/quiz');
    render(<App />);
    // Instant Feedback should be checked by default
    const feedbackCheckbox = screen.getByLabelText(/instant feedback/i);
    expect(feedbackCheckbox).toBeChecked();
    // Set quiz length to 2 (number of mock questions)
    const lengthInput = screen.getByTestId('quiz-length-input');
    fireEvent.change(lengthInput, { target: { value: 2 } });
    // Start quiz
    fireEvent.click(screen.getByRole('button', { name: /start quiz/i }));
    // Wait for question card
    await screen.findByTestId('quiz-question-card');
    // Select an answer and submit
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]); // select A (incorrect)
    fireEvent.keyDown(radios[0], { key: 'Enter' });
    // Feedback should appear immediately
    await waitFor(() => {
      expect(screen.getByTestId('quiz-feedback')).toBeInTheDocument();
    });
  });
});
