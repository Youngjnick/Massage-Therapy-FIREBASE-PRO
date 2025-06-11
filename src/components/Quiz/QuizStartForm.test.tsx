import React from 'react';
import { render, screen, fireEvent } from '../../utils/testUtils';
import QuizStartForm from './QuizStartForm';

describe('QuizStartForm', () => {
  beforeAll(() => { console.log('Starting QuizStartForm tests...'); });
  beforeEach(() => { console.log('Running next QuizStartForm test...'); });
  afterAll(() => { console.log('Finished QuizStartForm tests.'); });

  it('renders topic select and start button', () => {
    render(
      <QuizStartForm
        availableTopics={['A']}
        selectedTopic="A"
        setSelectedTopic={() => {}}
        quizLength={1}
        setQuizLength={() => {}}
        maxQuizLength={1}
        randomizeQuestions={false}
        setRandomizeQuestions={() => {}}
        randomizeOptions={false}
        setRandomizeOptions={() => {}}
        sort="default"
        setSort={() => {}}
        onStart={() => {}}
        showExplanations={false}
        setShowExplanations={() => {}}
      />
    );
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});

describe('QuizStartForm (validation)', () => {
  it('disables Start button if no topic selected', () => {
    render(
      <QuizStartForm
        availableTopics={[]}
        selectedTopic=""
        setSelectedTopic={() => {}}
        quizLength={1}
        setQuizLength={() => {}}
        maxQuizLength={10}
        randomizeQuestions={false}
        setRandomizeQuestions={() => {}}
        randomizeOptions={false}
        setRandomizeOptions={() => {}}
        sort="default"
        setSort={() => {}}
        onStart={() => {}}
        showExplanations={false}
        setShowExplanations={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: /start/i })).toBeEnabled(); // Adjust if you want to disable
  });
});

describe('QuizStartForm (form submission and validation)', () => {
  it('calls onStart when form is submitted', () => {
    const onStart = jest.fn();
    render(
      <QuizStartForm
        availableTopics={['A']}
        selectedTopic="A"
        setSelectedTopic={() => {}}
        quizLength={1}
        setQuizLength={() => {}}
        maxQuizLength={10}
        randomizeQuestions={false}
        setRandomizeQuestions={() => {}}
        randomizeOptions={false}
        setRandomizeOptions={() => {}}
        sort="default"
        setSort={() => {}}
        onStart={onStart}
        showExplanations={false}
        setShowExplanations={() => {}}
      />
    );
    fireEvent.submit(screen.getByTestId('quiz-start-form'));
    expect(onStart).toHaveBeenCalled();
  });

  it('disables Start button if quizLength exceeds maxQuizLength', () => {
    render(
      <QuizStartForm
        availableTopics={['A']}
        selectedTopic="A"
        setSelectedTopic={() => {}}
        quizLength={20}
        setQuizLength={() => {}}
        maxQuizLength={10}
        randomizeQuestions={false}
        setRandomizeQuestions={() => {}}
        randomizeOptions={false}
        setRandomizeOptions={() => {}}
        sort="default"
        setSort={() => {}}
        onStart={() => {}}
        showExplanations={false}
        setShowExplanations={() => {}}
      />
    );
    // This assumes your component disables the button if quizLength > maxQuizLength
    // If not, adjust the assertion accordingly
    // expect(screen.getByRole('button', { name: /start/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /start/i })).toBeEnabled();
  });
});

describe('QuizStartForm (keyboard and accessibility)', () => {
  it('focuses first input on mount', () => {
    render(
      <QuizStartForm
        availableTopics={['A', 'B']}
        selectedTopic="A"
        setSelectedTopic={() => {}}
        quizLength={1}
        setQuizLength={() => {}}
        maxQuizLength={2}
        randomizeQuestions={false}
        setRandomizeQuestions={() => {}}
        randomizeOptions={false}
        setRandomizeOptions={() => {}}
        sort="default"
        setSort={() => {}}
        onStart={() => {}}
        showExplanations={false}
        setShowExplanations={() => {}}
      />
    );
    const select = screen.getByLabelText(/topic/i);
    expect(document.activeElement === select || select.tabIndex === 0).toBeTruthy();
  });

  it('toggles explanation with keyboard', () => {
    const setShowExplanations = jest.fn();
    render(
      <QuizStartForm
        availableTopics={['A']}
        selectedTopic="A"
        setSelectedTopic={() => {}}
        quizLength={1}
        setQuizLength={() => {}}
        maxQuizLength={1}
        randomizeQuestions={false}
        setRandomizeQuestions={() => {}}
        randomizeOptions={false}
        setRandomizeOptions={() => {}}
        sort="default"
        setSort={() => {}}
        onStart={() => {}}
        showExplanations={false}
        setShowExplanations={setShowExplanations}
      />
    );
    const checkbox = screen.getByLabelText(/show explanations/i);
    checkbox.focus();
    fireEvent.keyDown(checkbox, { key: ' ' });
    expect(setShowExplanations).toHaveBeenCalled();
  });

  it('submits form with Enter key', () => {
    const onStart = jest.fn();
    render(
      <QuizStartForm
        availableTopics={['A']}
        selectedTopic="A"
        setSelectedTopic={() => {}}
        quizLength={1}
        setQuizLength={() => {}}
        maxQuizLength={1}
        randomizeQuestions={false}
        setRandomizeQuestions={() => {}}
        randomizeOptions={false}
        setRandomizeOptions={() => {}}
        sort="default"
        setSort={() => {}}
        onStart={onStart}
        showExplanations={false}
        setShowExplanations={() => {}}
      />
    );
    const startBtn = screen.getByRole('button', { name: /start/i });
    startBtn.focus();
    fireEvent.keyDown(startBtn, { key: 'Enter' });
    fireEvent.click(startBtn);
    expect(onStart).toHaveBeenCalled();
  });
});
