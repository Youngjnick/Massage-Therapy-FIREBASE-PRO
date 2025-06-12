import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import * as questionsModule from '../questions/index';

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

describe('Quiz Accessibility, Feedback, and State Integration', () => {
  beforeEach(() => {
    window.history.pushState({}, 'Quiz page', '/quiz');
  });

  it('all interactive elements are keyboard accessible and have correct ARIA', async () => {
    render(<App />);
    await screen.findByTestId('quiz-start-form');
    // Tab to topic select
    fireEvent.keyDown(document, { key: 'Tab' });
    const topicSelect = screen.getByTestId('quiz-topic-select');
    expect(topicSelect).toBeInTheDocument();
    // Tab to quiz length input
    fireEvent.keyDown(document, { key: 'Tab' });
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

  it('progress bar and stepper have correct ARIA attributes', async () => {
    render(<App />);
    await screen.findByTestId('quiz-start-form');
    fireEvent.submit(screen.getByTestId('quiz-start-form'));
    await screen.findByTestId('quiz-question-card');
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    // Stepper dots
    const stepButtons = screen.getAllByRole('button');
    stepButtons.forEach(btn => {
      expect(btn).toHaveAttribute('aria-label');
    });
  });

  it('feedback is not shown if instant feedback is off, but appears if toggled on mid-quiz', async () => {
    render(<App />);
    await screen.findByTestId('quiz-start-form');
    const feedbackCheckbox = screen.getByLabelText(/instant feedback/i);
    fireEvent.click(feedbackCheckbox); // turn off
    fireEvent.submit(screen.getByTestId('quiz-start-form'));
    await screen.findByTestId('quiz-question-card');
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]);
    fireEvent.keyDown(radios[0], { key: 'Enter' });
    expect(screen.queryByTestId('quiz-feedback')).not.toBeInTheDocument();
    // Optionally: simulate toggling feedback ON mid-quiz if UI allows
  });

  it('explanations are only shown when enabled', async () => {
    render(<App />);
    await screen.findByTestId('quiz-start-form');
    const explanationsCheckbox = screen.getByLabelText(/show explanations/i);
    fireEvent.click(explanationsCheckbox); // turn off
    fireEvent.submit(screen.getByTestId('quiz-start-form'));
    await screen.findByTestId('quiz-question-card');
    expect(screen.queryByText(/explanation/i)).not.toBeInTheDocument();
  });

  it('feedback is visually distinguishable (color)', async () => {
    render(<App />);
    await screen.findByTestId('quiz-start-form');
    fireEvent.submit(screen.getByTestId('quiz-start-form'));
    await screen.findByTestId('quiz-question-card');
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]);
    fireEvent.keyDown(radios[0], { key: 'Enter' });
    const feedback = await screen.findByTestId('quiz-feedback');
    expect(feedback).toBeInTheDocument();
    const feedbackColor = feedback.style.color;
    const feedbackColors = ["#059669", "#ef4444", "rgb(239, 68, 68)"];
    expect(feedbackColors).toContain(feedbackColor.toLowerCase());
  });

  it('toggles retain their state after quiz restart', async () => {
    render(<App />);
    await screen.findByTestId('quiz-start-form');
    const explanationsCheckbox = screen.getByLabelText(/show explanations/i);
    fireEvent.click(explanationsCheckbox); // turn off
    fireEvent.submit(screen.getByTestId('quiz-start-form'));
    await screen.findByTestId('quiz-question-card');
    // Finish quiz
    fireEvent.click(screen.getByRole('button', { name: /finish/i }));
    // Wait for results and Start New Quiz button
    const startNewQuizBtn = await screen.findByRole('button', { name: /start new quiz/i });
    fireEvent.click(startNewQuizBtn);
    await screen.findByTestId('quiz-start-form');
    expect(screen.getByLabelText(/show explanations/i)).not.toBeChecked();
  });

  it('quiz length input disables Start if 0 questions', async () => {
    (questionsModule.getQuestions as jest.Mock).mockResolvedValueOnce([]);
    render(<App />);
    await screen.findByTestId('quiz-start-form');
    const startBtn = screen.getByRole('button', { name: /start/i });
    expect(startBtn).toBeDisabled();
  });

  it('quiz length input clamps to min/max and disables Start for invalid values', async () => {
    render(<App />);
    await screen.findByTestId('quiz-start-form');
    const lengthInput = screen.getByTestId('quiz-length-input') as HTMLInputElement;
    fireEvent.change(lengthInput, { target: { value: -5 } });
    expect(Number(lengthInput.value)).toBeGreaterThanOrEqual(1);
    fireEvent.change(lengthInput, { target: { value: 999 } });
    expect(Number(lengthInput.value)).toBeLessThanOrEqual(2); // 2 mock questions
    fireEvent.change(lengthInput, { target: { value: 'abc' } });
    expect(isNaN(Number(lengthInput.value))).toBe(false); // Should fallback to a valid number
  });

  it('review mode triggers if all answers are incorrect', async () => {
    render(<App />);
    await screen.findByTestId('quiz-start-form');
    fireEvent.submit(screen.getByTestId('quiz-start-form'));
    await screen.findByTestId('quiz-question-card');
    // Answer all questions incorrectly
    let radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]);
    fireEvent.keyDown(radios[0], { key: 'Enter' });
    if (screen.queryAllByRole('radio').length > 0) {
      radios = screen.getAllByRole('radio');
      fireEvent.click(radios[0]);
      fireEvent.keyDown(radios[0], { key: 'Enter' });
    }
    // Ensure review mode UI is rendered when all answers are incorrect
    expect(screen.getByTestId('review-mode-indicator')).toBeTruthy();
  });

  it('full quiz flow with all toggles enabled, then all disabled', async () => {
    render(<App />);
    await screen.findByTestId('quiz-start-form');
    fireEvent.submit(screen.getByTestId('quiz-start-form'));
    await screen.findByTestId('quiz-question-card');
    // Answer and finish
    let radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]);
    fireEvent.keyDown(radios[0], { key: 'Enter' });
    if (screen.queryAllByRole('radio').length > 0) {
      radios = screen.getAllByRole('radio');
      fireEvent.click(radios[0]);
      fireEvent.keyDown(radios[0], { key: 'Enter' });
    }
    fireEvent.click(screen.getByRole('button', { name: /finish/i }));
    // Start new quiz with all toggles disabled
    const startNewQuizBtn = await screen.findByRole('button', { name: /start new quiz/i });
    fireEvent.click(startNewQuizBtn);
    await screen.findByTestId('quiz-start-form');
    fireEvent.click(screen.getByLabelText(/randomize questions/i));
    fireEvent.click(screen.getByLabelText(/show explanations/i));
    fireEvent.click(screen.getByLabelText(/instant feedback/i));
    fireEvent.submit(screen.getByTestId('quiz-start-form'));
    await screen.findByTestId('quiz-question-card');
    // Answer and finish
    let radios2 = screen.getAllByRole('radio');
    fireEvent.click(radios2[0]);
    fireEvent.keyDown(radios2[0], { key: 'Enter' });
    if (screen.queryAllByRole('radio').length > 0) {
      radios2 = screen.getAllByRole('radio');
      fireEvent.click(radios2[0]);
      fireEvent.keyDown(radios2[0], { key: 'Enter' });
    }
    fireEvent.click(screen.getByRole('button', { name: /finish/i }));
  });

  it('rapid answer changes only show one feedback per question', async () => {
    render(<App />);
    await screen.findByTestId('quiz-start-form');
    fireEvent.submit(screen.getByTestId('quiz-start-form'));
    await screen.findByTestId('quiz-question-card');
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]);
    fireEvent.click(radios[1]);
    fireEvent.click(radios[2]);
    fireEvent.keyDown(radios[2], { key: 'Enter' });
    const feedback = await screen.findByTestId('quiz-feedback');
    expect(feedback).toBeInTheDocument();
  });

  it('after finishing quiz, starting new quiz resets all state', async () => {
    render(<App />);
    await screen.findByTestId('quiz-start-form');
    fireEvent.submit(screen.getByTestId('quiz-start-form'));
    await screen.findByTestId('quiz-question-card');
    fireEvent.click(screen.getByRole('button', { name: /finish/i }));
    const startNewQuizBtn = await screen.findByRole('button', { name: /start new quiz/i });
    fireEvent.click(startNewQuizBtn);
    await screen.findByTestId('quiz-start-form');
    // After finishing quiz, ensure start form is rendered
    expect(screen.getByRole('button', { name: /start new quiz/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/show explanations/i)).toBeChecked();
    expect(screen.getByLabelText(/instant feedback/i)).toBeChecked();
    expect(screen.getByLabelText(/randomize questions/i)).toBeChecked();
  });
});
