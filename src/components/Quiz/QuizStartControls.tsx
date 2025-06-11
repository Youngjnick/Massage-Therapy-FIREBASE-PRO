import React from 'react';

interface QuizStartControlsProps {
  filter: string;
  setFilter: (val: string) => void;
  filterTag: string;
  setFilterTag: (val: string) => void;
  showInstantFeedback: boolean;
  setShowInstantFeedback: (val: boolean) => void;
}

const QuizStartControls: React.FC<QuizStartControlsProps> = ({
  filter,
  setFilter,
  filterTag,
  setFilterTag,
  showInstantFeedback,
  setShowInstantFeedback,
}) => (
  <>
    <label style={{ marginLeft: '1rem' }}>
      <input type="checkbox" checked={showInstantFeedback} onChange={e => setShowInstantFeedback(e.target.checked)} /> Instant Feedback
    </label>
    <label style={{ marginLeft: '1rem' }}>
      Filter:
      <select value={filter} onChange={e => setFilter(e.target.value)}>
        <option value="all">All</option>
        <option value="incorrect">Incorrect</option>
        <option value="unseen">Unseen</option>
        <option value="difficult">Difficult</option>
        <option value="tag">By Tag</option>
        <option value="slow">Slow (time &gt; 30s)</option>
      </select>
      {filter === 'tag' && (
        <input
          type="text"
          value={filterTag}
          onChange={e => setFilterTag(e.target.value)}
          placeholder="Enter tag"
          style={{ marginLeft: 4 }}
        />
      )}
    </label>
  </>
);

export default QuizStartControls;
