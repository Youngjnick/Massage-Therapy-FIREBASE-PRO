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
          exclude: ['node_modules', 'test/', 'tests/', 'e2e/', 'cypress/'],
          extension: ['.js', '.ts', '.jsx', '.tsx'],
          cypress: false,
          requireEnv: false, // Disable requireEnv to avoid strict env check
          forceBuildInstrument: true,
        }),
      ]
    : []),
];

export default defineConfig({
  base,
  plugins: plugins as any, // Explicitly cast plugins to avoid type errors
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    sourcemap: process.env.COVERAGE === 'true' ? true : false, // Enable sourcemaps only for coverage mode
  },
});
