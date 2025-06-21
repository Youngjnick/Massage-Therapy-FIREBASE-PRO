export function getFilteredSortedQuestions(questions: any[], selectedTopic: string, filter: string, filterValue: string, userAnswers: number[], shuffledOptions: { [key: number]: string[] }) {
  let qs = [...questions];
  if (selectedTopic) {
    qs = qs.filter((q: any) => Array.isArray(q.topics) && q.topics.includes(selectedTopic));
  }
  if (filter === 'incorrect') {
    qs = qs.filter((q, i) => userAnswers[i] !== undefined && (shuffledOptions[i] || q.options)[userAnswers[i]] !== q.correctAnswer);
  } else if (filter === 'unseen') {
    qs = qs.filter((q, i) => userAnswers[i] === undefined);
  } else if (filter === 'difficulty' && filterValue) {
    qs = qs.filter((q: any) => q.difficulty === filterValue);
  } else if (filter === 'tag' && filterValue) {
    qs = qs.filter((q: any) => q.tags && q.tags.includes(filterValue));
  }
  qs.sort((a, b) => (a.difficulty ?? 'easy') > (b.difficulty ?? 'easy') ? 1 : -1);
  return qs;
}
