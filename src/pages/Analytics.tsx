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
    const userDoc = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDoc, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setStats({
          quizzesTaken: userData.quizzesTaken || 0,
          correctAnswers: userData.correctAnswers || 0,
          totalQuestions: userData.totalQuestions || 0,
          accuracy: userData.accuracy || 0,
          streak: userData.streak || 0,
          badges: userData.badges || 0,
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
