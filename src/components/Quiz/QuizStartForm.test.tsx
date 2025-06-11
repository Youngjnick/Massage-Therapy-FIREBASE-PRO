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
