import { Request, Response, NextFunction } from 'express';
import path from 'path';
import process from 'process';

// SPA fallback middleware for Express: serves index.html for non-API, non-static requests
export function spaFallbackMiddleware(req: Request, res: Response, next: NextFunction) {
  if (
    req.method === 'GET' &&
    !req.path.startsWith('/api') &&
    !req.path.includes('.')
  ) {
    // Use project root to resolve index.html for production (dist/index.html)
    const indexPath = path.resolve(process.cwd(), 'dist/index.html');
    console.log('[spaFallbackMiddleware] Serving index.html from:', indexPath);
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('[spaFallbackMiddleware] Error sending index.html:', err);
        res.status(404).send('index.html not found');
      }
    });
  } else {
    next();
  }
}
