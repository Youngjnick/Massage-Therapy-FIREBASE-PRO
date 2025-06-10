// src/hooks/useQuestions.ts
import { useEffect, useState } from 'react';
import { getQuestions } from '../questions/index';
import { Question } from '../types/index';

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getQuestions()
      .then(qs => setQuestions(qs))
      .catch(() => setError('Failed to load questions'))
      .finally(() => setLoading(false));
  }, []);

  return { questions, loading, error };
}
