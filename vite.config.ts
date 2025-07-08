/* eslint-env node */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import istanbul from 'vite-plugin-istanbul';

// Use / for local dev, /Massage-Therapy-FIREBASE-PRO/ for production (GitHub Pages)
const base = process.env.NODE_ENV === 'production'
  ? '/Massage-Therapy-FIREBASE-PRO/'
  : '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    istanbul({
      include: 'src/**/*', // Instrument all files in src and subfolders
      exclude: ['node_modules', 'test/', 'tests/', 'e2e/', 'cypress/'],
      extension: ['.js', '.ts', '.jsx', '.tsx'],
      cypress: false,
      requireEnv: false, // Disable requireEnv to avoid strict env check
      forceBuildInstrument: process.env.COVERAGE === 'true',
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
});
