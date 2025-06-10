import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Massage-Therapy-FIREBASE-PRO/',
  plugins: [react()],
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
  server: {
refactor/modularize-app

    historyApiFallback: true,
main
  },
  appType: 'spa',
});
