import { useState } from 'react';

export function useQuizFormValidation({ quizLength, selectedTopic }: { quizLength: number; selectedTopic: string }) {
  const [error, setError] = useState<string | null>(null);

  function validate() {
    if (!selectedTopic) {
      setError('Please select a topic.');
      return false;
    }
    if (quizLength < 1) {
      setError('Quiz length must be at least 1.');
      return false;
    }
    setError(null);
    return true;
  }

  return { error, validate };
}
