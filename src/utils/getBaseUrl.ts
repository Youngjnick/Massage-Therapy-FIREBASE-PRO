export function getBaseUrl() {
  let baseUrl = '/';
  try {
    const meta = new Function('return typeof import !== "undefined" ? import.meta : undefined')();
    if (meta && meta.env && meta.env.BASE_URL) {
      baseUrl = meta.env.BASE_URL;
    }
  } catch {
    // Swallow errors from environments that do not support import.meta
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

export const BASE_URL = getBaseUrl();