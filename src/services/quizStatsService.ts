import { getAuth } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseClient';
import { Question } from '../types';

export async function updateQuizStatsOnFinish({
  userAnswers,
  shuffledQuestions,
  shuffledOptions,
  started,
  quizQuestions
}: {
  userAnswers: number[];
  shuffledQuestions: Question[];
  shuffledOptions: { [key: number]: string[] };
  started: boolean;
  quizQuestions: Question[];
}) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    const stats: { [topic: string]: { correct: number; total: number } } = {};
    (started ? shuffledQuestions : quizQuestions).forEach((q, i) => {
      const topic = q.topic || 'Other';
      if (!stats[topic]) stats[topic] = { correct: 0, total: 0 };
      stats[topic].total++;
      if (
        userAnswers[i] !== undefined &&
        (shuffledOptions[i] || q.options)[userAnswers[i]] === q.correctAnswer
      ) {
        stats[topic].correct++;
      }
    });
    const correct = Object.values(stats).reduce((sum, s) => sum + s.correct, 0);
    const total = Object.values(stats).reduce((sum, s) => sum + s.total, 0);
    const analyticsRef = doc(db, 'users', user.uid, 'stats', 'analytics');
    const prevSnap = await getDoc(analyticsRef);
    const prev = prevSnap.exists() ? prevSnap.data() : {};
    const streakHistory = Array.isArray(prev.streakHistory) ? [...prev.streakHistory] : [];
    streakHistory.push({ date: new Date().toISOString(), streak: prev.streak || 0 });
    const badgeProgress = { ...prev.badgeProgress, correct: correct };
    await setDoc(
      analyticsRef,
      {
        completed: (prev.completed || 0) + 1,
        correct,
        total,
        streak: prev.streak || 0,
        badges: prev.badges || 0,
        badgeProgress,
        streakHistory,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    const topicStatsRef = doc(db, 'users', user.uid, 'stats', 'topicStats');
    await setDoc(topicStatsRef, stats, { merge: true });
  } catch (err) {
    console.error('Failed to update Firestore stats at quiz finish:', err);
  }
}

export async function updateQuizStatsOnAnswer({
  userAnswers,
  shuffledQuestions,
  shuffledOptions,
  started,
  quizQuestions
}: {
  userAnswers: number[];
  shuffledQuestions: Question[];
  shuffledOptions: { [key: number]: string[] };
  started: boolean;
  quizQuestions: Question[];
}) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    const stats: { [topic: string]: { correct: number; total: number } } = {};
    (started ? shuffledQuestions : quizQuestions).forEach((q, i) => {
      const topic = q.topic || 'Other';
      if (!stats[topic]) stats[topic] = { correct: 0, total: 0 };
      stats[topic].total++;
      if (
        userAnswers[i] !== undefined &&
        (shuffledOptions[i] || q.options)[userAnswers[i]] === q.correctAnswer
      ) {
        stats[topic].correct++;
      }
    });
    const correct = Object.values(stats).reduce((sum, s) => sum + s.correct, 0);
    const total = Object.values(stats).reduce((sum, s) => sum + s.total, 0);
    const analyticsRef = doc(db, 'users', user.uid, 'stats', 'analytics');
    const prevSnap = await getDoc(analyticsRef);
    const prev = prevSnap.exists() ? prevSnap.data() : {};
    const badgeProgress = { ...prev.badgeProgress, correct: correct };
    await setDoc(
      analyticsRef,
      {
        correct,
        total,
        streak: prev.streak || 0,
        badges: prev.badges || 0,
        badgeProgress,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    const topicStatsRef = doc(db, 'users', user.uid, 'stats', 'topicStats');
    await setDoc(topicStatsRef, stats, { merge: true });
  } catch (err) {
    console.error('Failed to update Firestore stats on answer:', err);
  }
}
