import React from 'react';
import QuizSortSelect from './QuizSortSelect';
import QuizTopicSelect from './QuizTopicSelect';
import QuizLengthInput from './QuizLengthInput';

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
}) => (
  <form style={{ marginBottom: '1rem' }} onSubmit={e => { e.preventDefault(); onStart(); }}>
    <QuizTopicSelect
      availableTopics={availableTopics}
      selectedTopic={selectedTopic}
      setSelectedTopic={setSelectedTopic}
    />
    <QuizLengthInput
      quizLength={quizLength}
      setQuizLength={setQuizLength}
      maxQuizLength={maxQuizLength}
    />
    <label style={{ marginLeft: '1rem' }}>
      <input type="checkbox" checked={randomizeQuestions} onChange={e => setRandomizeQuestions(e.target.checked)} /> Randomize Questions
    </label>
    <label style={{ marginLeft: '1rem' }}>
      <input type="checkbox" checked={randomizeOptions} onChange={e => setRandomizeOptions(e.target.checked)} /> Randomize Options
    </label>
    <QuizSortSelect sort={sort} setSort={setSort} />
    <button type="submit" style={{ marginLeft: '1rem' }}>Start Quiz</button>
  </form>
);

export default QuizStartForm;
