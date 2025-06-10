import { useCallback } from 'react';

// Example: Google Analytics, Mixpanel, or custom event logging
export function useAnalytics() {
  // Replace this with your analytics service (e.g., window.gtag, Mixpanel, etc.)
  const logEvent = useCallback((event: string, params?: Record<string, any>) => {
    // Example: window.gtag('event', event, params);
    // Example: mixpanel.track(event, params);
    // For now, just log to console
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[analytics]', event, params);
    }
  }, []);

  return { logEvent };
}
