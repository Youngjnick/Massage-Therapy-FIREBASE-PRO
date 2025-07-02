 
import React from 'react';

interface QuizSortSelectProps {
  sort: string;
  setSort: (val: string) => void;
}

const QuizSortSelect: React.FC<QuizSortSelectProps> = ({ sort, setSort }) => (
  <label style={{ marginLeft: '1rem' }}>
    Sort:
    <select value={sort} onChange={e => setSort(e.target.value)}>
      <option value="default">Default</option>
      <option value="accuracy">By Accuracy</option>
      <option value="time">By Time</option>
      <option value="difficulty">By Difficulty</option>
    </select>
  </label>
);

export default QuizSortSelect;
