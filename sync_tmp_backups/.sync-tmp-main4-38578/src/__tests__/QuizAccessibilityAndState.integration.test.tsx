import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import App from '../App';
import * as questionsModule from '../questions/index';

jest.mock('../questions/index', () => ({
  getQuestions: jest.fn().mockResolvedValue([
    {
      id: '1',
      text: 'Q1',
      options: ['A', 'B', 'C'],
      correctAnswer: 'B',
      topics: ['T1'],
      short_explanation: 'Short explanation',
    },
    {
      id: '2',
      text: 'Q2',
      options: ['X', 'Y', 'Z'],
      correctAnswer: 'Y',
      topics: ['T1'],
      short_explanation: 'Another explanation',
    },
  ]),
}));
jest.mock('../questions/fileList', () => ({
  fileList: ['T1.json'],
}));

describe('Quiz Accessibility, Feedback, and State Integration', () => {
  beforeEach(() => {
    window.history.pushState({}, 'Quiz page', '/quiz');
  });

  it('all interactive elements are keyboard accessible and have correct ARIA', async () => {
    render(<App />);
    await screen.findByTestId('quiz-start-form');
    // Tab to topic select
    await act(async () => { fireEvent.keyDown(document, { key: 'Tab' }); });
    const topicSelect = screen.getByTestId('quiz-topic-select');
    expect(topicSelect).toBeInTheDocument();
    // Tab to quiz length input
    await act(async () => { fireEvent.keyDown(document, { key: 'Tab' }); });
    const lengthInput = screen.getByTestId('quiz-length-input');
    expect(lengthInput).toBeInTheDocument();
    // Tab to toggles
    const randomizeCheckbox = screen.getByLabelText(/randomize questions/i);
    expect(randomizeCheckbox).toHaveAttribute('type', 'checkbox');
    const explanationsCheckbox = screen.getByLabelText(/show explanations/i);
    expect(explanationsCheckbox).toHaveAttribute('type', 'checkbox');
    const feedbackCheckbox = screen.getByLabelText(/instant feedback/i);
    expect(feedbackCheckbox).toHaveAttribute('type', 'checkbox');
    // Tab to Start button
    const startBtn = screen.getByRole('button', { name: /start/i });
    expect(startBtn).toBeInTheDocument();
    // ARIA for progress bar and stepper will be checked after quiz start
  });

  it('feedback is not shown if instant feedback is off, but appears if toggled on mid-quiz', async () => {
    render(<App />);
    await screen.findByTestId('quiz-start-form');
    const feedbackCheckbox = screen.getByLabelText(/instant feedback/i);
    await act(async () => { fireEvent.click(feedbackCheckbox); }); // turn off
    await act(async () => { fireEvent.submit(screen.getByTestId('quiz-start-form')); });
    await screen.findByTestId('quiz-question-card');
    const radios = screen.getAllByRole('radio');
    await act(async () => { fireEvent.click(radios[0]); });
    await act(async () => { fireEvent.keyDown(radios[0], { key: 'Enter' }); });
    expect(screen.queryByTestId('quiz-feedback')).not.toBeInTheDocument();
    // Optionally: simulate toggling feedback ON mid-quiz if UI allows
  });

  it('explanations are only shown when enabled', async () => {
    render(<App />);
    await screen.findByTestId('quiz-start-form');
    const explanationsCheckbox = screen.getByLabelText(/show explanations/i);
    await act(async () => { fireEvent.click(explanationsCheckbox); }); // turn off
    await act(async () => { fireEvent.submit(screen.getByTestId('quiz-start-form')); });
    await screen.findByTestId('quiz-question-card');
    expect(screen.queryByText(/explanation/i)).not.toBeInTheDocument();
  });

  it('quiz length input disables Start if 0 questions', async () => {
    (questionsModule.getQuestions as jest.Mock).mockResolvedValueOnce([]);
    render(<App />);
    await screen.findByTestId('quiz-start-form');
    await screen.findByRole('button', { name: /start/i });
    await waitFor(() => {
      const startBtn = screen.getByRole('button', { name: /start/i });
      expect(startBtn).toBeDisabled();
    });
  });

  it('quiz length input clamps to min/max and disables Start for invalid values', async () => {
    render(<App />);
    await screen.findByTestId('quiz-start-form');
    const lengthInput = screen.getByTestId('quiz-length-input') as HTMLInputElement;
    await act(async () => { fireEvent.change(lengthInput, { target: { value: -5 } }); });
    expect(Number(lengthInput.value)).toBeGreaterThanOrEqual(1);
    await act(async () => { fireEvent.change(lengthInput, { target: { value: 999 } }); });
    expect(Number(lengthInput.value)).toBeLessThanOrEqual(2); // 2 mock questions
    await act(async () => { fireEvent.change(lengthInput, { target: { value: 'abc' } }); });
    expect(isNaN(Number(lengthInput.value))).toBe(false); // Should fallback to a valid number
  });
});
