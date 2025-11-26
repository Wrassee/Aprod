// server/app.ts - JAVÍTOTT VERZIÓ

import express from 'express';
import 'dotenv/config';
import { registerRoutes } from './routes.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 PARAMÉTER HOZZÁADÁSA
interface AppConfig {
  mode: 'development' | 'production';
}

export async function createApp(config: AppConfig) {
  const app = express();
  const isProduction = config.mode === 'production';

  // ===================================================
  // CORS - DINAMIKUS
  // ===================================================
  app.use(cors({
    origin: (origin, callback) => {
      if (!isProduction) {
        return callback(null, true);
      }
      
      const allowedOrigins = [
        'capacitor://localhost',
        'http://localhost',
        'ionic://localhost',
        /^https:\/\/.*\.onrender\.com$/,
      ];
      
      if (!origin) {
        return callback(null, true);
      }
      
      const isAllowed = allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') {
          return allowed === origin;
        }
        return allowed.test(origin);
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`⚠️ CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));

  app.use(express.json());

  // ===================================================
  // SECURITY HEADERS
  // ===================================================
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    if (isProduction) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    next();
  });

  // ===================================================
  // STATIC FILES (PRODUCTION)
  // ===================================================
  if (isProduction) {
    // 🔥 FONTOS: Statikus fájlok kiszolgálása (dist mappa)
    const distPath = path.join(__dirname, '..', '..', 'dist');
    console.log(`📁 Serving static files from: ${distPath}`);
    
    app.use(express.static(distPath, {
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
    }));
  }

  // ===================================================
  // LOGGING
  // ===================================================
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      console.log(`[API Request] ${req.method} ${req.path}`);
    }
    next();
  });
  
  // ===================================================
  // API ROUTES
  // ===================================================
  await registerRoutes(app);
  
  // ===================================================
  // SPA FALLBACK (PRODUCTION)
  // ===================================================
  if (isProduction) {
    // 🔥 Minden nem-API kérést az index.html-re irányít (SPA routing)
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        const indexPath = path.join(__dirname, '..', '..', 'dist', 'index.html');
        res.sendFile(indexPath);
      } else {
        res.status(404).json({ message: 'API endpoint not found' });
      }
    });
  }
  
  // ===================================================
  // GLOBAL ERROR HANDLER
  // ===================================================
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[Global Error Handler] Unhandled error on path: ${req.path}`, err);
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ message });
  });

  return app;
}