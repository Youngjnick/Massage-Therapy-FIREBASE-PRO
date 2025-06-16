import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseClient';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import QuizTopicProgress from '../components/Quiz/QuizTopicProgress';

const Analytics: React.FC = () => {
  const [stats, setStats] = useState({
    quizzesTaken: 0,
    correctAnswers: 0,
    totalQuestions: 0,
    accuracy: 0,
    streak: 0,
    badges: 0,
  });
  const [user, setUser] = useState<User | null>(null);
  const [topicStats, setTopicStats] = useState<{ [topic: string]: { correct: number; total: number } }>({});

  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    // Listen to /users/{uid}/stats/analytics (valid document path)
    const analyticsDoc = doc(db, 'users', user.uid, 'stats', 'analytics');
    const unsubscribeAnalytics = onSnapshot(analyticsDoc, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStats({
          quizzesTaken: data.completed || 0,
          correctAnswers: data.correct || 0,
          totalQuestions: data.total || 0,
          accuracy: data.total ? Math.round((data.correct / data.total) * 100) : 0,
          streak: data.streak || 0,
          badges: data.badges || 0,
        });
      } else {
        setStats({
          quizzesTaken: 0,
          correctAnswers: 0,
          totalQuestions: 0,
          accuracy: 0,
          streak: 0,
          badges: 0,
        });
      }
    });
    // Listen to /users/{uid}/stats/topicStats for per-topic breakdown
    const topicStatsDoc = doc(db, 'users', user.uid, 'stats', 'topicStats');
    const unsubscribeTopicStats = onSnapshot(topicStatsDoc, (docSnap) => {
      if (docSnap.exists()) {
        setTopicStats(docSnap.data() || {});
      } else {
        setTopicStats({});
      }
    });
    return () => {
      unsubscribeAnalytics();
      unsubscribeTopicStats();
    };
  }, [user]);

  if (!user) {
    return <div>Please sign in to view your analytics.</div>;
  }

  return (
    <div>
      <h1>Analytics</h1>
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
      {/* Topic breakdown */}
      <div style={{ marginTop: 32 }}>
        <h3>Topic Breakdown</h3>
        <QuizTopicProgress topicStats={topicStats} />
      </div>
      {/* Quiz history chart */}
      <div style={{ marginTop: 32 }}>
        <h3>Quiz Activity (Last 14 Days)</h3>
        {/* TODO: Implement or import QuizHistoryChart, and install 'react-chartjs-2' and 'chart.js' if needed */}
        {/* <QuizHistoryChart history={history} /> */}
      </div>
      {/* Add charts, graphs, or more analytics as needed */}
    </div>
  );
};
export default Analytics;
