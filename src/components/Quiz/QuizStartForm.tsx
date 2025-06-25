import React, { useRef, useEffect, useState } from 'react';
import QuizSortSelect from './QuizSortSelect';
import QuizTopicSelect from './QuizTopicSelect';
import QuizLengthInput from './QuizLengthInput';
// import TopicsTreeDropdown from '../TopicsTreeDropdown';

interface QuizStartFormProps {
  availableTopics: string[];
  selectedTopic: string;
  setSelectedTopic: (topic: string) => void;
  quizLength: number | '';
  setQuizLength: (len: number | '') => void;
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
  // Ref for the quiz length input
  const lengthInputRef = useRef<HTMLInputElement>(null);
  // Error state for required fields
  const [error, setError] = useState<string | null>(null);
  // Auto-focus the quiz length input when the form appears
  useEffect(() => {
    if (lengthInputRef.current) {
      lengthInputRef.current.focus();
    }
  }, []);

  function validate() {
    if (!props.selectedTopic) return 'Please select a topic.';
    if (!props.quizLength && props.quizLength !== 0) return 'Please enter a valid quiz length.';
    if (props.quizLength < 1) return 'Quiz length must be at least 1.';
    if (!props.availableTopics || props.availableTopics.length === 0) return 'No topics available.';
    return null;
  }

  return (
    <>
      <form data-testid="quiz-start-form" style={{ marginBottom: '1rem' }} onSubmit={e => {
        e.preventDefault();
        const validationError = validate();
        if (validationError) {
          setError(validationError);
          return;
        }
        setError(null);
        props.onStart({ selectedTopic: props.selectedTopic, quizLength: props.quizLength, sort: props.sort, ...toggleState });
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
          <label htmlFor="quiz-topic-select">Topic</label>
          <QuizTopicSelect
            availableTopics={props.availableTopics}
            selectedTopic={props.selectedTopic}
            setSelectedTopic={props.setSelectedTopic}
            id="quiz-topic-select"
          />
          <QuizLengthInput
            quizLength={props.quizLength}
            setQuizLength={props.setQuizLength}
            maxQuizLength={props.maxQuizLength}
            id="quiz-length-input"
            data-testid="quiz-length-input"
            ref={lengthInputRef}
          />
          <QuizSortSelect sort={props.sort} setSort={props.setSort} />
        </div>
        {/* <div style={{ margin: '1rem 0' }}>
          <TopicsTreeDropdown
            onSelect={filePath => {
              // Set the selected topic to the file path (without .json and folders)
              // You may want to extract just the topic name or use the full path
              const topic = filePath.replace(/\.json$/, '').split('/').pop() || filePath;
              props.setSelectedTopic(topic);
              // Optionally, auto-start the quiz
              if (props.quizLength && props.quizLength > 0) {
                props.onStart({ selectedTopic: topic, quizLength: props.quizLength, sort: props.sort, ...toggleState });
              }
            }}
          />
        </div> */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', margin: '1rem 0' }}>
          <div>
            <label htmlFor="show-explanations-toggle">Show Explanations</label>
            <input
              id="show-explanations-toggle"
              type="checkbox"
              checked={toggleState.showExplanations}
              aria-label="Show Explanations toggle"
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
              aria-label="Instant Feedback toggle"
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
              aria-label="Randomize Questions toggle"
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
              aria-label="Randomize Options toggle"
              onChange={e => setToggleState({ ...toggleState, randomizeOptions: e.target.checked })}
              style={{ marginLeft: 6 }}
            />
          </div>
        </div>
        <label style={{ marginLeft: '1rem' }}>
          Filter:
          <select value={props.filter} onChange={e => props.setFilter(e.target.value)} aria-label="Filter questions">
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
            <select value={props.filterValue} onChange={e => props.setFilterValue(e.target.value)} aria-label="Select difficulty">
              <option value="">All</option>
              {props.availableDifficulties?.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        )}
        {props.filter === 'tag' && (
          <label style={{ marginLeft: '1rem' }}>
            Tag:
            <select value={props.filterValue} onChange={e => props.setFilterValue(e.target.value)} aria-label="Select tag">
              <option value="">All</option>
              {props.availableTags?.map(tag => <option key={tag} value={tag}>{tag}</option>)}
            </select>
          </label>
        )}
        <button style={{ marginLeft: '1rem' }} type="submit" aria-label="Start Quiz" disabled={props.quizLength === '' || props.quizLength < 1 || props.maxQuizLength === 0 || !props.availableTopics || props.availableTopics.length === 0 || !props.selectedTopic}>Start Quiz</button>
        {error && (
          <div style={{ color: 'red', marginTop: 12 }} data-testid="quiz-start-error" role="alert">{error}</div>
        )}
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
