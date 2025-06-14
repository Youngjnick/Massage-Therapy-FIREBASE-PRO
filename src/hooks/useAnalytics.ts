import { useCallback } from 'react';
import { analytics, firebaseLogEvent } from '../firebase/firebaseConfig';

export function useAnalytics() {
  const logEvent = useCallback((event: string, params?: Record<string, any>) => {
    if (analytics) {
      firebaseLogEvent(analytics, event, params);
    } else {
      // Fallback: log to console if analytics is not available
      console.log('[analytics]', event, params);
    }
  }, []);

  return { logEvent };
}
