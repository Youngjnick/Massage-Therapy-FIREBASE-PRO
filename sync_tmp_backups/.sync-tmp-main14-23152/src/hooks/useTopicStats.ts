import { useEffect, useState } from 'react';

export function useTopicStats(activeQuestions: any[], userAnswers: number[], shuffledOptions: { [key: number]: string[] }) {
  const [topicStats, setTopicStats] = useState<{[topic:string]:{correct:number,total:number}}>({});
  useEffect(() => {
    const stats: {[topic:string]:{correct:number,total:number}} = {};
    activeQuestions.forEach((q, i) => {
      const topic = q.topic || 'Other';
      if (!stats[topic]) stats[topic] = { correct: 0, total: 0 };
      stats[topic].total++;
      const correctOpt = (shuffledOptions[i] || q.options).indexOf(q.correctAnswer);
      if (userAnswers[i] === correctOpt) stats[topic].correct++;
    });
    setTopicStats(stats);
  }, [userAnswers, shuffledOptions, activeQuestions]);
  return topicStats;
}
