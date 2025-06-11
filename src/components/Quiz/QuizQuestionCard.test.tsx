import React from 'react';
import { render, screen } from '../../utils/testUtils';
import QuizQuestionCard from './QuizQuestionCard';

describe('QuizQuestionCard', () => {
  beforeAll(() => { console.log('Starting QuizQuestionCard tests...'); });
  beforeEach(() => { console.log('Running next QuizQuestionCard test...'); });
  afterAll(() => { console.log('Finished QuizQuestionCard tests.'); });

  it('renders question text', () => {
    render(
      <QuizQuestionCard
        q={{ text: 'What is the capital of France?', options: ['Paris', 'London', 'Berlin', 'Rome'], id: '1' }}
        current={0}
        userAnswers={[]}
        answered={false}
        handleAnswer={() => {}}
        optionRefs={{ current: [] }}
        showExplanations={false}
        shuffledOptions={{ 0: ['Paris', 'London', 'Berlin', 'Rome'] }}
      />
    );
    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
  });
});
