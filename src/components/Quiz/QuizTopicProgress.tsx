import React from 'react';

interface TopicStats {
  [topic: string]: { correct: number; total: number };
}

interface QuizTopicProgressProps {
  topicStats: TopicStats;
}

const QuizTopicProgress: React.FC<QuizTopicProgressProps> = ({ topicStats }) => {
  if (!topicStats || Object.entries(topicStats).length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
      {Object.entries(topicStats).map(([topic, stat]) => (
        <div key={topic} style={{ minWidth: 120 }}>
          <div style={{ fontWeight: 600 }}>{topic}</div>
          <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, margin: '4px 0', position: 'relative' }}>
            <div
              style={{
                width: `${stat.total ? ((stat.correct / stat.total) * 100) : 0}%`,
                height: '100%',
                background: '#3b82f6',
                borderRadius: 4,
                transition: 'width 0.3s',
              }}
            />
          </div>
          <div style={{ fontSize: 12 }}>{stat.correct} / {stat.total} correct</div>
        </div>
      ))}
    </div>
  );
};

export default QuizTopicProgress;
