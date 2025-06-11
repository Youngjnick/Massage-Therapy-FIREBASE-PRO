import React from 'react';
jest.mock('../questions/index', () => ({
  getQuestions: jest.fn().mockResolvedValue([
    {
      id: '1',
      text: 'What is the capital of France?',
      options: ['Paris', 'London', 'Berlin', 'Madrid'],
      correctAnswer: 'Paris',
      topic: 'Geography',
    },
    {
      id: '2',
      text: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
      topic: 'Math',
    },
  ]),
}));
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

jest.mock('../utils/baseUrl', () => ({ BASE_URL: '/' }));

describe('Quiz Flow Integration', () => {
  it('allows a user to start a quiz, answer questions, and see results', async () => {
    window.history.pushState({}, 'Quiz page', '/quiz');
    render(<App />);

    // Wait for start form
    const startForm = await screen.findByTestId('quiz-start-form');
    expect(startForm).toBeInTheDocument();
    // Select topic if needed
    const topicSelect = screen.getByTestId('quiz-topic-select');
    fireEvent.change(topicSelect, { target: { value: 'Geography' } });
    // Set quiz length to 1 (since only 1 question for selected topic)
    const lengthInput = screen.getByTestId('quiz-length-input');
    fireEvent.change(lengthInput, { target: { value: 1 } });
    // Start quiz
    const startBtn = screen.getByRole('button', { name: /start quiz/i });
    fireEvent.click(startBtn);

    // Wait for the question card to appear
    const questionCard = await screen.findByTestId('quiz-question-card');
    expect(questionCard).toBeInTheDocument();
    // Find the question text (legend)
    const questionText = questionCard.querySelector('legend');
    expect(questionText).toBeTruthy();
    // Wait for radios to appear
    const radios = await screen.findAllByRole('radio');
    fireEvent.click(radios[0]);
    // Submit answer (simulate Enter key)
    fireEvent.keyDown(radios[0], { key: 'Enter' });

    // Next question or results (depends on quiz length)
    // Try to find a result summary or score
    const maybeResults = screen.queryAllByText(/score|result|congratulations|completed/i);
    if (maybeResults.length > 0) {
      expect(maybeResults.length).toBeGreaterThan(0);
    } else {
      // If not finished, answer next question
      const nextRadios = screen.getAllByRole('radio');
      fireEvent.click(nextRadios[0]);
      fireEvent.keyDown(nextRadios[0], { key: 'Enter' });
      // Now expect results
      const results = await screen.findAllByText(/score|result|congratulations|completed/i);
      expect(results.length).toBeGreaterThan(0);
    }
  });
});
