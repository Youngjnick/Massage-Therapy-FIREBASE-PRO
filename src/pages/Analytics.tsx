import React, { useEffect, useState } from 'react';

const Analytics: React.FC = () => {
  // Demo stats, replace with real data from Firestore/user context
  const [stats, setStats] = useState({
    quizzesTaken: 12,
    correctAnswers: 87,
    totalQuestions: 100,
    accuracy: 87,
    streak: 5,
    badges: 7,
  });

  useEffect(() => {
    // TODO: Fetch real analytics from Firestore/user context
  }, []);

  return (
    <div>
      <h2>Analytics</h2>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginTop: 24 }}>
        <div>
          <strong>Quizzes Taken:</strong> {stats.quizzesTaken}
        </div>
        <div>
          <strong>Correct Answers:</strong> {stats.correctAnswers} / {stats.totalQuestions}
        </div>
        <div>
          <strong>Accuracy:</strong> {stats.accuracy}%
        </div>
        <div>
          <strong>Current Streak:</strong> {stats.streak} days
        </div>
        <div>
          <strong>Badges Earned:</strong> {stats.badges}
        </div>
      </div>
      {/* Add charts, graphs, or more analytics as needed */}
    </div>
  );
};
export default Analytics;
