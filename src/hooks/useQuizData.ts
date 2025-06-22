import { useEffect, useState } from 'react';
import { getQuestions } from '../questions';
import { getBookmarks } from '../bookmarks';
import { getAuth } from 'firebase/auth';
import { Question } from '../types';
import { fileList as questionFileList } from '../questions/fileList';

// Pure function for fetching quiz questions
export async function fetchQuizQuestions() {
  return getQuestions();
}

export function useQuizData(selectedTopic: string, setSelectedTopic: (topic: string) => void) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Derive availableTopics from filenames (relative to questions root, without .json)
  const availableTopics = (questionFileList as string[]).map((f: string) => f.replace(/\.json$/, ''));

  useEffect(() => {
    fetchQuizQuestions()
      .then((qs) => {
        setQuestions(qs);
        if (!selectedTopic && availableTopics.length > 0) setSelectedTopic(availableTopics.at(-1) ?? "");
      })
      .catch((err) => {
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

  return {
    questions,
    setQuestions,
    loading,
    setLoading,
    error,
    setError,
    availableTopics, // <-- expose availableTopics
  };
}
