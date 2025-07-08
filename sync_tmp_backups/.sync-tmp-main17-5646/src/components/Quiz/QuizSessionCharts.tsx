import React from 'react';

interface QuizSessionChartsProps {
  topicStats: { [topic: string]: { correct: number; total: number } };
}

const QuizSessionCharts: React.FC<QuizSessionChartsProps> = ({ topicStats }) => {
  // Placeholder for future chart/insight visualizations
  return (
    <div style={{ margin: '1rem 0' }}>
      <h4>Accuracy by Topic</h4>
      <ul>
        {Object.entries(topicStats).map(([topic, stat]) => (
          <li key={topic}>
            {topic}: {stat.correct} / {stat.total} correct ({stat.total ? Math.round((stat.correct / stat.total) * 100) : 0}%)
          </li>
        ))}
      </ul>
      {/* Add chart components here in the future */}
    </div>
  );
};

export default QuizSessionCharts;
