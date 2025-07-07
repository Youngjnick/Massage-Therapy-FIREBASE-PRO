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
    console.log('[E2E DEBUG] updateQuizStatsOnFinish: called', { userAnswers, started, quizQuestionsLength: quizQuestions.length });
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      console.log('[E2E DEBUG] updateQuizStatsOnFinish: No user');
      return;


    }
    console.log('[E2E DEBUG] updateQuizStatsOnFinish: User UID', user.uid);
    // Extra debug: log all input data
    console.log('[E2E DEBUG] updateQuizStatsOnFinish: input', {
      userAnswers,
      shuffledQuestions,
      shuffledOptions,
      started,
      quizQuestions
    });
    const stats: { [topic: string]: { correct: number; total: number } } = {};
    (started ? shuffledQuestions : quizQuestions).forEach((q, i) => {
      const topic = (q.topics && q.topics.at(-1)) || 'Other';
      if (!stats[topic]) stats[topic] = { correct: 0, total: 0 };
      stats[topic].total++;
      if (
        userAnswers[i] !== undefined &&
        (shuffledOptions[i] || q.options)[userAnswers[i]] === q.correctAnswer
      ) {
        stats[topic].correct++;
      }
    });
    const correct = Object.values(stats).reduce((sum, s) => sum + (s as { correct: number; total: number }).correct, 0);
    const total = Object.values(stats).reduce((sum, s) => sum + (s as { correct: number; total: number }).total, 0);
    const analyticsRef = doc(db, 'users', user.uid, 'stats', 'analytics');
    const prevSnap = await getDoc(analyticsRef);
    const prev = prevSnap.exists() ? prevSnap.data() : {};
    console.log('[E2E DEBUG] updateQuizStatsOnFinish: prev analytics', { user: user.uid, prev });
    const streakHistory = Array.isArray(prev.streakHistory) ? [...prev.streakHistory] : [];
    streakHistory.push({ date: new Date().toISOString(), streak: prev.streak || 0 });
    const badgeProgress = { ...prev.badgeProgress, correct: correct };
    const newCompleted = (prev.completed || 0) + 1;
    // Log all values before writing
    console.log('[E2E DEBUG] updateQuizStatsOnFinish: about to write analytics', {
      user: user.uid,
      prevCompleted: prev.completed,
      newCompleted,
      correct,
      total,
      stats,
      badgeProgress,
      streakHistory,
      stack: new Error().stack
    });
    // Log Firestore doc paths and data before writing
    console.log('[E2E DEBUG] Firestore analyticsRef path:', analyticsRef.path);
    console.log('[E2E DEBUG] Firestore analyticsRef data:', {
      completed: newCompleted,
      correct,
      total,
      streak: prev.streak || 0,
      badges: prev.badges || 0,
      badgeProgress,
      streakHistory,
      updatedAt: new Date().toISOString(),
    });
    try {
      await setDoc(
        analyticsRef,
        {
          completed: newCompleted,
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
      console.log('[E2E DEBUG] updateQuizStatsOnFinish: analytics write success', {
        user: user.uid,
        completed: newCompleted
      });
      if (typeof window !== 'undefined') {
        (window as any).__QUIZ_STATS_DEBUG__ = {
          status: 'success',
          user: user.uid,
          completed: newCompleted,
          correct,
          total,
          time: new Date().toISOString(),
        };
      }
    } catch (writeErr) {
      console.error('[E2E DEBUG] updateQuizStatsOnFinish: analytics write error', writeErr);
      if (typeof window !== 'undefined') {
        (window as any).__QUIZ_STATS_DEBUG__ = {
          status: 'error',
          user: user.uid,
          error: (writeErr && (writeErr as any).message) ? (writeErr as any).message : String(writeErr),
          time: new Date().toISOString(),
        };
      }
    }
    const topicStatsRef = doc(db, 'users', user.uid, 'stats', 'topicStats');
    // Log Firestore doc paths and data before writing
    console.log('[E2E DEBUG] Firestore topicStatsRef path:', topicStatsRef.path);
    console.log('[E2E DEBUG] Firestore topicStatsRef data:', stats);
    try {
      await setDoc(topicStatsRef, stats, { merge: true });
      console.log('[E2E DEBUG] updateQuizStatsOnFinish: topicStats write success', { user: user.uid });
    } catch (topicWriteErr) {
      console.error('[E2E DEBUG] updateQuizStatsOnFinish: topicStats write error', topicWriteErr);
    }
    await writeQuizProgressToFirestore({
      userAnswers,
      shuffledQuestions,
      showResults: true,
    });
  } catch (err) {
    console.error('[E2E DEBUG] Failed to update Firestore stats at quiz finish:', err);
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
      const topic = (q.topics && q.topics.at(-1)) || 'Other';
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

/**
 * Write quiz progress to Firestore: users/{uid}/quizProgress/current
 * Includes userAnswers, shuffledQuestions, showResults, and timestamp.
 * Adds debug logging for E2E diagnosis.
 */
export async function writeQuizProgressToFirestore({
  userAnswers,
  shuffledQuestions,
  showResults
}: {
  userAnswers: number[];
  shuffledQuestions: Question[];
  showResults: boolean;
}) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      console.log('[E2E DEBUG] writeQuizProgressToFirestore: No user');
      return;
    }
    const quizProgressRef = doc(db, 'users', user.uid, 'quizProgress', 'current');
    const data = {
      userAnswers,
      shuffledQuestions,
      showResults,
      updatedAt: new Date().toISOString(),
    };
    console.log('[E2E DEBUG] Firestore quizProgressRef path:', quizProgressRef.path);
    console.log('[E2E DEBUG] Firestore quizProgressRef data:', data);
    await setDoc(quizProgressRef, data, { merge: true });
    console.log('[E2E DEBUG] writeQuizProgressToFirestore: success');
  } catch (err) {
    console.error('[E2E DEBUG] writeQuizProgressToFirestore: error', err);
  }
}
