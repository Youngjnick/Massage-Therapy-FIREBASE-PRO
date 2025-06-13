import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use '/' for local dev, '/Massage-Therapy-FIREBASE-PRO/' for production (GitHub Pages)
const isProd = process.env.NODE_ENV === 'production';
const base = isProd ? '/Massage-Therapy-FIREBASE-PRO/' : '/';

export default defineConfig({
  base,
  plugins: [react()],
});
