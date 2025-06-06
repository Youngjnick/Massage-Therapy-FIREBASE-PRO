/**
 * React hook for persistent state using localStorage.
 * @template T
 * @param {string} key - The localStorage key.
 * @param {T} defaultValue - The default value if nothing is stored.
 * @returns {[T, (value: T) => void]} Tuple of value and setter.
 */

import { useState, useEffect } from "react";

// A React hook for persistent state using localStorage, but only inside the hook (not in components)
export default function usePersistentState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);

  return [value, setValue];
}
