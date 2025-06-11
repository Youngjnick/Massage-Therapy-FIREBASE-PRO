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
  filter: string;
  setFilter: (val: string) => void;
  filterValue: string;
  setFilterValue: (val: string) => void;
  availableDifficulties?: string[];
  availableTags?: string[];
  showInstantFeedback: boolean;
  setShowInstantFeedback: (val: boolean) => void;
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
  filter,
  setFilter,
  filterValue,
  setFilterValue,
  availableDifficulties = ['easy', 'medium', 'intermediate', 'hard'],
  availableTags = [],
  showInstantFeedback,
  setShowInstantFeedback,
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
      data-testid="quiz-length-input"
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
        onKeyDown={e => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            setShowExplanations(!showExplanations);
          }
        }}
      />
      Show Explanations
    </label>
    <label>
      <input
        type="checkbox"
        checked={showInstantFeedback}
        onChange={e => setShowInstantFeedback(e.target.checked)}
        aria-label="Instant Feedback"
        onKeyDown={e => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            setShowInstantFeedback(!showInstantFeedback);
          }
        }}
      />
      Instant Feedback
    </label>
    <label style={{ marginLeft: '1rem' }}>
      Filter:
      <select value={filter} onChange={e => setFilter(e.target.value)}>
        <option value="all">All</option>
        <option value="incorrect">Incorrect</option>
        <option value="unseen">Unseen</option>
        <option value="difficulty">By Difficulty</option>
        <option value="tag">By Tag</option>
      </select>
    </label>
    {filter === 'difficulty' && (
      <label style={{ marginLeft: '1rem' }}>
        Difficulty:
        <select value={filterValue} onChange={e => setFilterValue(e.target.value)}>
          <option value="">All</option>
          {availableDifficulties.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </label>
    )}
    {filter === 'tag' && (
      <label style={{ marginLeft: '1rem' }}>
        Tag:
        <select value={filterValue} onChange={e => setFilterValue(e.target.value)}>
          <option value="">All</option>
          {availableTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
        </select>
      </label>
    )}
    <button type="submit" style={{ marginLeft: '1rem' }}>Start Quiz</button>
  </form>
);

export default QuizStartForm;
