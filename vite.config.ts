/* eslint-env node */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import istanbul from 'vite-plugin-istanbul';

// Use / for local dev, /Massage-Therapy-FIREBASE-PRO/ for production (GitHub Pages)
const base = process.env.NODE_ENV === 'production'
  ? '/Massage-Therapy-FIREBASE-PRO/'
  : '/';

const plugins = [
  react(),
  ...(process.env.COVERAGE === 'true'
    ? [
        istanbul({
          include: 'src/**/*', // Instrument all files in src and subfolders
          exclude: [], // Removed exclusions to ensure all files are instrumented
          extension: ['.js', '.ts', '.jsx', '.tsx'],
          cypress: false,
          requireEnv: false, // Disable requireEnv to avoid strict env check
          forceBuildInstrument: true,
        }),
      ]
    : []),
];

console.log('[DEBUG] COVERAGE:', process.env.COVERAGE);
console.log('[DEBUG] Istanbul plugin initialized:', process.env.COVERAGE === 'true');
console.log('[DEBUG] Istanbul plugin configuration:', {
  include: 'src/**/*',
  exclude: [],
  extension: ['.js', '.ts', '.jsx', '.tsx'],
  cypress: false,
  requireEnv: false,
  forceBuildInstrument: true,
});

export default defineConfig({
  base,
  plugins,
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    sourcemap: process.env.COVERAGE === 'true' ? true : false, // Enable sourcemaps only for coverage mode
  },
});
