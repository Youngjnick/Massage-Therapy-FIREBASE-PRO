import { useEffect } from 'react';

interface UseQuizKeyboardNavigationProps {
  started: boolean;
  current: number;
  next: () => void;
  prev: () => void;
  
  handleAnswer: (idx: number) => void;
  optionsLength: number;
}

export function useQuizKeyboardNavigation({ started, current, next, prev, handleAnswer, optionsLength }: UseQuizKeyboardNavigationProps) {
  useEffect(() => {
    if (!started) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        prev();
      } else if (/^[1-9]$/.test(e.key)) {
        const _idx = parseInt(e.key, 10) - 1;
        if (_idx < optionsLength) handleAnswer(_idx);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [started, current, next, prev, handleAnswer, optionsLength]);
}
