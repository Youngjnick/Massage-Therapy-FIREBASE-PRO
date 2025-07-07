export function getTopicStats(activeQuestions: any[], userAnswers: number[], shuffledOptions: { [key: number]: string[] }) {
  const stats: { [topic: string]: { correct: number; total: number } } = {};
  activeQuestions.forEach((q, i) => {
    const topic = (q && q.topic) || 'Other';
    if (!stats[topic]) stats[topic] = { correct: 0, total: 0 };
    if (userAnswers[i] !== undefined) {
      const opts = shuffledOptions[i] || (q && q.options) || [];
      const correctOpt = opts.indexOf(q && q.correctAnswer);
      if (userAnswers[i] === correctOpt) stats[topic].correct++;
      stats[topic].total++;
    }
  });
  return stats;
}
