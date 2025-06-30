/* eslint-env node */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use / for local dev, /Massage-Therapy-FIREBASE-PRO/ for production (GitHub Pages)
const base = process.env.NODE_ENV === 'production'
  ? '/Massage-Therapy-FIREBASE-PRO/'
  : '/';

export default defineConfig({
  base,
  plugins: [
    react(),
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
});
