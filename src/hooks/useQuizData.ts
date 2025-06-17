import { useEffect, useState } from 'react';
import { getQuestions } from '../questions';
import { getBookmarks } from '../bookmarks';
import { getAuth } from 'firebase/auth';
import { Question } from '../types';

export function useQuizData(selectedTopic: string, setSelectedTopic: (topic: string) => void) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getQuestions()
      .then((qs) => {
        setQuestions(qs);
        const topics = Array.from(new Set(qs.map((q: any) => q.topic || 'Other')));
        if (!selectedTopic && topics.length > 0) setSelectedTopic(topics[0]);
      })
      .catch((err) => {
        // Debug output for test diagnosis
        // eslint-disable-next-line no-console
        console.log('[useQuizData] Failed to load questions:', err);
        setError('Error: Failed to load questions. Could not load questions.');
      })
      .finally(() => setLoading(false));

    getBookmarks('demoUser');
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    // Optionally: load user settings here
  }, []);

  // Firestore update helpers can be added here as needed

  return {
    questions,
    setQuestions,
    loading,
    setLoading,
    error,
    setError,
  };
}
