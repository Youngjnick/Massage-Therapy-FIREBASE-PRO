import { useState, useRef } from 'react';
import { Question } from '../types';

export function useQuizState() {
  const [started, setStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [current, setCurrent] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<{ [key: number]: string[] }>({});
  const [answered, setAnswered] = useState(false);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);
  const [questionStart, setQuestionStart] = useState<number | null>(null);
  const [reviewQueue, setReviewQueue] = useState<number[]>([]);
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(false);
  const [filter, setFilter] = useState<'all' | 'incorrect' | 'unseen' | 'difficulty' | 'tag'>('all');
  const [filterValue, setFilterValue] = useState<string>('');
  const [sort, setSort] = useState<string>('default');
  const [topicStats, setTopicStats] = useState<{[topic:string]:{correct:number,total:number}}>({});
  const optionRefs = useRef<(HTMLInputElement | null)[]>([]);

  return {
    started,
    setStarted,
    showResults,
    setShowResults,
    current,
    setCurrent,
    userAnswers,
    setUserAnswers,
    shuffledQuestions,
    setShuffledQuestions,
    shuffledOptions,
    setShuffledOptions,
    answered,
    setAnswered,
    questionTimes,
    setQuestionTimes,
    questionStart,
    setQuestionStart,
    reviewQueue,
    setReviewQueue,
    hasCompletedQuiz,
    setHasCompletedQuiz,
    filter,
    setFilter,
    filterValue,
    setFilterValue,
    sort,
    setSort,
    topicStats,
    setTopicStats,
    optionRefs,
  };
}
