export function getBaseUrl() {
  try {
    // Accessing import.meta.env.BASE_URL is only valid in Vite; will throw in Jest/Node
    if ((globalThis as any).import?.meta?.env?.BASE_URL) {
      const baseUrl = (globalThis as any).import.meta.env.BASE_URL;
      if (typeof window !== 'undefined') {
        // Prominent debug log for production
        console.log('[DEBUG][getBaseUrl] BASE_URL at runtime:', baseUrl, 'window.location:', window.location.href);
      }
      return baseUrl;
    }
  } catch {
    // Ignore errors in non-Vite environments
  }
  // Fallback for Jest or Node environments
  if (typeof window !== 'undefined') {
    console.log('[DEBUG][getBaseUrl] BASE_URL fallback: /', 'window.location:', window.location.href);
  }
  return '/';
}

export const BASE_URL = getBaseUrl();