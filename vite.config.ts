/* eslint-env node */
import { defineConfig } from 'vite';
import { getPlugins } from './config/plugins';
import { isCoverageEnabled, isProduction } from './config/env';

const base = isProduction() ? '/Massage-Therapy-FIREBASE-PRO/' : '/';

export default defineConfig({
  base,
  plugins: getPlugins(isCoverageEnabled()),
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    sourcemap: isCoverageEnabled(),
  },
});
