export function getQuizFeedback(q: any, current: number, userAnswers: number[], shuffledOptions: { [key: number]: string[] }) {
  if (!q || q.text === 'No questions available') return 'No questions available.';
  const opts = shuffledOptions[current] || q.options || [];
  const correctOpt = opts.indexOf(q.correctAnswer);
  if (userAnswers[current] === undefined) {
    return 'No answer submitted.';
  } else if (userAnswers[current] === correctOpt) {
    return 'Correct!';
  } else {
    return 'Incorrect.';
  }
}
