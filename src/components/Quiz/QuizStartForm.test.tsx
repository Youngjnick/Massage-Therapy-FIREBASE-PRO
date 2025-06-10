import React from 'react';
import { render, screen } from '../../utils/testUtils';
import QuizStartForm from './QuizStartForm';

describe('QuizStartForm', () => {
  beforeAll(() => { console.log('Starting QuizStartForm tests...'); });
  beforeEach(() => { console.log('Running next QuizStartForm test...'); });
  afterAll(() => { console.log('Finished QuizStartForm tests.'); });

  it('renders topic select and start button', () => {
    render(
      <QuizStartForm
        availableTopics={['Anatomy', 'Pathology']}
        selectedTopic="Anatomy"
        setSelectedTopic={() => {}}
        quizLength={10}
        setQuizLength={() => {}}
        maxQuizLength={20}
        randomizeQuestions={false}
        setRandomizeQuestions={() => {}}
        randomizeOptions={false}
        setRandomizeOptions={() => {}}
        sort="default"
        setSort={() => {}}
        onStart={() => {}}
      />
    );
    expect(screen.getByText('Anatomy')).toBeInTheDocument();
  });
});
