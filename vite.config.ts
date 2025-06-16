import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// Use / for local dev, /Massage-Therapy-FIREBASE-PRO/ for production (GitHub Pages)
const base = process.env.NODE_ENV === 'production'
  ? '/Massage-Therapy-FIREBASE-PRO/'
  : '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/badges',
          dest: '.'
        }
      ]
    })
  ],
});
