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
  sort: string;
  setSort: (val: string) => void;
  onStart: (values: any) => void;
  filter: string;
  setFilter: (val: string) => void;
  filterValue: string;
  setFilterValue: (val: string) => void;
  availableDifficulties?: string[];
  availableTags?: string[];
  toggleState: {
    showExplanations: boolean;
    instantFeedback: boolean;
    randomizeQuestions: boolean;
    randomizeOptions: boolean;
  };
  setToggleState: (state: any) => void;
  showStartNewQuiz?: boolean;
  onStartNewQuiz?: () => void;
}

const QuizStartForm: React.FC<QuizStartFormProps> = (props) => {
  const { toggleState, setToggleState } = props;

  return (
    <>
      <form data-testid="quiz-start-form" style={{ marginBottom: '1rem' }} onSubmit={e => { e.preventDefault(); props.onStart({ selectedTopic: props.selectedTopic, quizLength: props.quizLength, sort: props.sort, ...toggleState }); }}>
        <label htmlFor="quiz-topic-select">Topic</label>
        <QuizTopicSelect
          availableTopics={props.availableTopics}
          selectedTopic={props.selectedTopic}
          setSelectedTopic={props.setSelectedTopic}
          id="quiz-topic-select"
        />
        <label htmlFor="quiz-length-input">Quiz Length</label>
        <QuizLengthInput
          quizLength={props.quizLength}
          setQuizLength={len => props.setQuizLength(Math.max(1, Math.min(len, props.maxQuizLength)))}
          maxQuizLength={props.maxQuizLength}
          id="quiz-length-input"
          data-testid="quiz-length-input"
        />
        <QuizSortSelect sort={props.sort} setSort={props.setSort} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', margin: '1rem 0' }}>
          <div>
            <label htmlFor="show-explanations-toggle">Show Explanations</label>
            <input
              id="show-explanations-toggle"
              type="checkbox"
              checked={toggleState.showExplanations}
              onChange={e => setToggleState({ ...toggleState, showExplanations: e.target.checked })}
              onKeyDown={e => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  setToggleState({ ...toggleState, showExplanations: !toggleState.showExplanations });
                }
              }}
            />
          </div>
          <div>
            <label htmlFor="instant-feedback-toggle">Instant Feedback</label>
            <input
              id="instant-feedback-toggle"
              type="checkbox"
              checked={toggleState.instantFeedback}
              onChange={e => setToggleState({ ...toggleState, instantFeedback: e.target.checked })}
              style={{ marginLeft: 6 }}
            />
          </div>
          <div>
            <label htmlFor="randomize-questions-toggle">Randomize Questions</label>
            <input
              id="randomize-questions-toggle"
              type="checkbox"
              checked={toggleState.randomizeQuestions}
              onChange={e => setToggleState({ ...toggleState, randomizeQuestions: e.target.checked })}
              style={{ marginLeft: 6 }}
            />
          </div>
          <div>
            <label htmlFor="randomize-options-toggle">Randomize Options</label>
            <input
              id="randomize-options-toggle"
              type="checkbox"
              checked={toggleState.randomizeOptions}
              onChange={e => setToggleState({ ...toggleState, randomizeOptions: e.target.checked })}
              style={{ marginLeft: 6 }}
            />
          </div>
        </div>
        <label style={{ marginLeft: '1rem' }}>
          Filter:
          <select value={props.filter} onChange={e => props.setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="incorrect">Incorrect</option>
            <option value="unseen">Unseen</option>
            <option value="difficulty">By Difficulty</option>
            <option value="tag">By Tag</option>
          </select>
        </label>
        {props.filter === 'difficulty' && (
          <label style={{ marginLeft: '1rem' }}>
            Difficulty:
            <select value={props.filterValue} onChange={e => props.setFilterValue(e.target.value)}>
              <option value="">All</option>
              {props.availableDifficulties?.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        )}
        {props.filter === 'tag' && (
          <label style={{ marginLeft: '1rem' }}>
            Tag:
            <select value={props.filterValue} onChange={e => props.setFilterValue(e.target.value)}>
              <option value="">All</option>
              {props.availableTags?.map(tag => <option key={tag} value={tag}>{tag}</option>)}
            </select>
          </label>
        )}
        <button style={{ marginLeft: '1rem' }} type="submit" disabled={props.quizLength <= 0 || !props.availableTopics || props.availableTopics.length === 0 || !props.selectedTopic}>Start Quiz</button>
      </form>
      {props.showStartNewQuiz && (
        <button
          type="button"
          role="button"
          data-testid="start-new-quiz-btn"
          aria-label="Start New Quiz"
          onClick={props.onStartNewQuiz}
          style={{ marginLeft: '1rem', marginTop: '1rem' }}
        >
          Start New Quiz
        </button>
      )}
    </>
  );
};

export default QuizStartForm;
