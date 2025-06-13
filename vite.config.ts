import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use root base for dev, and custom base for production
const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  base: isProd ? '/Massage-Therapy-FIREBASE-PRO/' : '/',
  plugins: [react()],
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
  appType: 'spa',
});
