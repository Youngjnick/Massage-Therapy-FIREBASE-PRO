// Jest does not support import.meta.env, so fallback to process.env or '/'
// let baseUrl = '/';
// if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) {
//   baseUrl = import.meta.env.BASE_URL;
// } else if (typeof globalThis !== 'undefined' && typeof globalThis.process !== 'undefined' && globalThis.process.env && globalThis.process.env.BASE_URL) {
//   baseUrl = globalThis.process.env.BASE_URL;
// }
// export const BASE_URL = baseUrl;

export function getBaseUrl() {
  // Avoid direct import.meta reference for Jest compatibility
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
