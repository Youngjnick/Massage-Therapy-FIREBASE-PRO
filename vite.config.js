// Vite config to ensure HMR client uses the correct port for Playwright/E2E
export default {
  server: {
    port: 1234,
    hmr: {
      port: 1234,
    },
  },
};
