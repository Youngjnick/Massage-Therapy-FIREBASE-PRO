import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Massage-Therapy-FIREBASE-PRO/', // Set to your repo name for GitHub Pages
  plugins: [react()],
});
