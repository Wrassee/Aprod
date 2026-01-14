// server/app.ts - FINAL WORKING VERSION (CORS FIXED)

import express from 'express';
import 'dotenv/config';
import { registerRoutes } from './routes.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AppConfig {
  mode: 'development' | 'production';
}

export async function createApp(config: AppConfig) {
  const app = express();
  const isProduction = config.mode === 'production';

  console.log(`🔧 Starting app in ${config.mode} mode`);

  // ===================================================
  // CORS
  // ===================================================
  app.use(cors({
    origin: (origin, callback) => {
      // Fejlesztéskor mindent engedünk
      if (!isProduction) {
        return callback(null, true);
      }
      
      const allowedOrigins = [
        'capacitor://localhost',
        'http://localhost',
        'https://localhost', // 👈 EZT ADTAM HOZZÁ! (Android HTTPS support)
        'ionic://localhost',
        /^https:\/\/.*\.onrender\.com$/, // Render domainek
      ];
      
      // Ha nincs origin (pl. backend-to-backend hívás), engedjük
      if (!origin) {
        return callback(null, true);
      }
      
      // Ellenőrizzük, hogy az origin benne van-e a listában
      const isAllowed = allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') {
          return allowed === origin;
        }
        return allowed.test(origin); // Regex ellenőrzés
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

  // 🔧 Increased limit for high-DPI mobile signatures (Samsung Fold5, etc.)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    const distPath = path.join(__dirname, '..');
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
      console.log(`[API] ${req.method} ${req.path}`);
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
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        const indexPath = path.join(__dirname, '..', 'index.html');
        console.log(`📄 Serving SPA: ${req.path} -> ${indexPath}`);
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
    console.error(`[ERROR] Path: ${req.path}`, err);
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ message });
  });

  return app;
}