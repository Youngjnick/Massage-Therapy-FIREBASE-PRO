/* global process */
export function getBaseUrl() {
  // Use process.env for Node/Jest, import.meta.env for browser/Vite, fallback to '/'
  if (
    typeof process !== 'undefined' &&
    process.env &&
    (process.env.JEST_WORKER_ID || process.env.NODE_ENV === 'test')
  ) {
    return '/';
  }
  let baseUrl = '/';
  try {
    // Use Function constructor to avoid static import.meta reference
    baseUrl = Function('try { return import.meta.env.BASE_URL || "/" } catch { return "/" }')();
  } catch {
    // Ignore errors in environments that do not support import.meta
  }
  if (
    typeof globalThis !== 'undefined' &&
    globalThis.process &&
    globalThis.process.env &&
    globalThis.process.env.BASE_URL
  ) {
    baseUrl = globalThis.process.env.BASE_URL;
  }
  return baseUrl;
}
