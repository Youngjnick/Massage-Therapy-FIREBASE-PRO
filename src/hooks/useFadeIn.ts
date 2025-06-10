import React, { useEffect } from 'react';

export function useFadeIn(ref: React.RefObject<HTMLElement>, duration = 400) {
  useEffect(() => {
    if (ref.current) {
      ref.current.style.opacity = '0';
      ref.current.style.transition = `opacity ${duration}ms`;
      setTimeout(() => {
        if (ref.current) ref.current.style.opacity = '1';
      }, 10);
    }
  }, [ref, duration]);
}
