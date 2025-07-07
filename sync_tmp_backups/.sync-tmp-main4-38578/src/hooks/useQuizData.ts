import { useEffect, useState } from 'react';
import { getQuestions } from '../questions';
import { getBookmarks } from '../bookmarks';
import { getAuth } from 'firebase/auth';
import { Question } from '../types';
import { fileList as questionFileList } from '../questions/fileList';

// Pure function for fetching quiz questions
export async function fetchQuizQuestions() {
  const start = Date.now();
  try {
    const result = await getQuestions();
    console.log('[useQuizData] getQuestions resolved in', Date.now() - start, 'ms');
    return result;
  } catch (err) {
    console.error('[useQuizData] getQuestions failed after', Date.now() - start, 'ms:', err);
    throw err;
  }
}

export function useQuizData(selectedTopic: string, setSelectedTopic: (topic: string) => void) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Derive availableTopics from filenames (relative to questions root, without .json)
  const availableTopics = (questionFileList as string[]).map((f: string) => f.replace(/\.json$/, ''));

  useEffect(() => {
    const start = Date.now();
    fetchQuizQuestions()
      .then((qs) => {
        setQuestions(qs);
        if (!selectedTopic && availableTopics.length > 0) setSelectedTopic(availableTopics.at(-1) ?? "");
        console.log('[useQuizData] setQuestions done in', Date.now() - start, 'ms');
      })
      .catch((err) => {
         
        console.log('[useQuizData] Failed to load questions:', err);
        setError('Error: Failed to load questions. Could not load questions.');
      })
      .finally(() => {
        setLoading(false);
        console.log('[useQuizData] setLoading(false) after', Date.now() - start, 'ms');
      });

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
