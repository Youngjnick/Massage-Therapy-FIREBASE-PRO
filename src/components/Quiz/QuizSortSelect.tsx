import React from 'react';

interface QuizSortSelectProps {
  sort: string;
  setSort: (val: string) => void;
}

const QuizSortSelect = ({ sort = 'default', setSort = () => {} }: QuizSortSelectProps) => {
  return (
    <select data-testid="quiz-sort-select" value={sort} onChange={e => setSort(e.target.value)}>
      <option value="default">Default</option>
      <option value="asc">Ascending</option>
      <option value="desc">Descending</option>
    </select>
  );
};

export default QuizSortSelect;
