import React from 'react';
import QuizSortSelect from './QuizSortSelect';
import QuizTopicSelect from './QuizTopicSelect';
import QuizLengthInput from './QuizLengthInput';
import QuizRandomizeOptions from './QuizRandomizeOptions';

interface QuizStartFormProps {
  availableTopics: string[];
  selectedTopic: string;
  setSelectedTopic: (topic: string) => void;
  quizLength: number;
  setQuizLength: (len: number) => void;
  maxQuizLength: number;
  randomizeQuestions: boolean;
  setRandomizeQuestions: (val: boolean) => void;
  randomizeOptions: boolean;
  setRandomizeOptions: (val: boolean) => void;
  sort: string;
  setSort: (val: string) => void;
  onStart: () => void;
  showExplanations: boolean;
  setShowExplanations: (val: boolean) => void;
}

const QuizStartForm: React.FC<QuizStartFormProps> = ({
  availableTopics,
  selectedTopic,
  setSelectedTopic,
  quizLength,
  setQuizLength,
  maxQuizLength,
  randomizeQuestions,
  setRandomizeQuestions,
  randomizeOptions,
  setRandomizeOptions,
  sort,
  setSort,
  onStart,
  showExplanations,
  setShowExplanations,
}) => (
  <form data-testid="quiz-start-form" style={{ marginBottom: '1rem' }} onSubmit={e => { e.preventDefault(); onStart(); }}>
    <label htmlFor="quiz-topic-select">Topic</label>
    <QuizTopicSelect
      availableTopics={availableTopics}
      selectedTopic={selectedTopic}
      setSelectedTopic={setSelectedTopic}
      id="quiz-topic-select"
    />
    <label htmlFor="quiz-length-input">Quiz Length</label>
    <QuizLengthInput
      quizLength={quizLength}
      setQuizLength={setQuizLength}
      maxQuizLength={maxQuizLength}
      id="quiz-length-input"
    />
    <QuizRandomizeOptions
      randomizeQuestions={randomizeQuestions}
      setRandomizeQuestions={setRandomizeQuestions}
      randomizeOptions={randomizeOptions}
      setRandomizeOptions={setRandomizeOptions}
    />
    <QuizSortSelect sort={sort} setSort={setSort} />
    <label>
      <input
        type="checkbox"
        checked={showExplanations}
        onChange={e => setShowExplanations(e.target.checked)}
        aria-label="Show Explanations"
      />
      Show Explanations
    </label>
    <button type="submit" style={{ marginLeft: '1rem' }}>Start Quiz</button>
  </form>
);

export default QuizStartForm;
