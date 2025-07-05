import { useEffect, useState } from 'react';

export function useTopicStats(activeQuestions: any[], userAnswers: (number | undefined)[], shuffledOptions: { [key: number]: string[] }) {
  const [topicStats, setTopicStats] = useState<{[topic:string]:{correct:number,total:number}}>({});
  useEffect(() => {
    const stats: {[topic:string]:{correct:number,total:number}} = {};
    activeQuestions.forEach((q, i) => {
      // Support both q.topic and q.topics (array, last element is quiz topic)
      let topic = 'Other';
      if (Array.isArray(q.topics) && q.topics.length > 0) {
        topic = q.topics[q.topics.length - 1];
      } else if (q.topic) {
        topic = q.topic;
      }
      if (!stats[topic]) stats[topic] = { correct: 0, total: 0 };
      stats[topic].total++;
      const correctOpt = (shuffledOptions[i] || q.options).indexOf(q.correctAnswer);
      if (userAnswers[i] === correctOpt) stats[topic].correct++;
    });
    setTopicStats(stats);
  }, [userAnswers, shuffledOptions, activeQuestions]);
  return topicStats;
}
