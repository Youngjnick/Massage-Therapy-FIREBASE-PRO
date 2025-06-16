import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const base = process.env.VITE_BASE || '/';

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
