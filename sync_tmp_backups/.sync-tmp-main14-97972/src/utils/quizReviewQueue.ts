export function getReviewQueueAllWrong(activeQuestions: any[], userAnswers: number[], shuffledOptions: { [key: number]: string[] }) {
  if (
    activeQuestions.length > 0 &&
    userAnswers.length === activeQuestions.length &&
    activeQuestions.every((q, i) => {
      const opts = shuffledOptions[i] || q.options || [];
      const correctOpt = opts.indexOf(q.correctAnswer);
      return userAnswers[i] !== correctOpt;
    })
  ) {
    return activeQuestions.map((_, i) => i);
  }
  return [];
}

export function getReviewQueueStreak(userAnswers: number[], activeQuestions: any[], shuffledOptions: { [key: number]: string[] }) {
  let wrongStreak = 0;
  for (let i = userAnswers.length - 1; i >= 0; i--) {
    if (userAnswers[i] !== undefined) {
      const q = activeQuestions[i] || { options: [], correctAnswer: undefined };
      const opts = shuffledOptions[i] || q.options || [];
      const correctOpt = opts.indexOf(q.correctAnswer);
      if (userAnswers[i] !== correctOpt) wrongStreak++;
      else break;
    }
  }
  if (wrongStreak >= 3) {
    const review = [];
    for (let i = userAnswers.length - 1; i >= 0 && review.length < 3; i--) {
      if (userAnswers[i] !== undefined) {
        const q = activeQuestions[i] || { options: [], correctAnswer: undefined };
        const opts = shuffledOptions[i] || q.options || [];
        const correctOpt = opts.indexOf(q.correctAnswer);
        if (userAnswers[i] !== correctOpt) review.push(i);
      }
    }
    return review.reverse();
  }
  return [];
}
