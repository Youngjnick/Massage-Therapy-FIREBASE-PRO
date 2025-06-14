export function getBaseUrl() {
  try {
    // Accessing import.meta.env.BASE_URL is only valid in Vite; will throw in Jest/Node
    if ((globalThis as any).import?.meta?.env?.BASE_URL) {
      return (globalThis as any).import.meta.env.BASE_URL;
    }
  } catch {
    // Ignore errors in non-Vite environments
  }
  // Fallback for Jest or Node environments
  return '/';
}

export const BASE_URL = getBaseUrl();