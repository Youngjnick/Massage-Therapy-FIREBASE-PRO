import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseClient';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

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
    const unsubscribe = onSnapshot(analyticsDoc, (docSnap) => {
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
      }
    });
    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return <div>Please sign in to view your analytics.</div>;
  }

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
