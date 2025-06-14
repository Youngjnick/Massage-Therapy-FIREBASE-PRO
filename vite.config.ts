import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function firebaseAuthHandlerMiddleware() {
  return {
    name: 'firebase-auth-handler-middleware',
    configureServer(server) {
      // Place at the very start of the middleware stack
      server.middlewares.stack.unshift({
        route: '',
        handle: (req, res, next) => {
          if (req.url && req.url.startsWith('/__/auth/handler')) {
            console.log('[VITE DEBUG] (UNSHIFT) Serving index.html for /__/auth/handler');
            const indexHtml = readFileSync(resolve(__dirname, 'index.html'), 'utf-8');
            res.setHeader('Content-Type', 'text/html');
            res.statusCode = 200;
            res.end(indexHtml);
            return;
          }
          next();
        }
      });
      // Keep the test-middleware for debugging
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/test-middleware')) {
          console.log('[VITE DEBUG] Test middleware hit');
          res.setHeader('Content-Type', 'text/plain');
          res.statusCode = 200;
          res.end('Vite middleware is working!');
          return;
        }
        next();
      });
    }
  };
}

// Use '/' for local dev, '/Massage-Therapy-FIREBASE-PRO/' for production (GitHub Pages)
const isProd = process.env.NODE_ENV === 'production';
const base = isProd ? '/Massage-Therapy-FIREBASE-PRO/' : '/';

export default defineConfig({
  base,
  plugins: [react(), firebaseAuthHandlerMiddleware()],
  server: {
    port: 5173,
    host: true,
  },
});
