// server/app.ts - DINAMIKUS CORS (bármely Render URL működik)

import express from 'express';
import 'dotenv/config';
import { registerRoutes } from './routes.js';
import cors from 'cors';

export async function createApp() {
  const app = express();

  // 🔥 DINAMIKUS CORS - Automatikusan kezeli a Render URL-eket
  const isProduction = process.env.NODE_ENV === 'production';
  
  app.use(cors({
    origin: (origin, callback) => {
      // Development: mindenhonnan engedélyezett
      if (!isProduction) {
        return callback(null, true);
      }
      
      // Production: Engedélyezett origin-ek
      const allowedOrigins = [
        'capacitor://localhost', // Android app
        'http://localhost', // iOS app
        'ionic://localhost', // Ionic
        /^https:\/\/.*\.onrender\.com$/, // ⚡ BÁRMELY Render URL (regex)
        /^https:\/\/aprod-app-.*\.onrender\.com$/, // Specifikus Render pattern
      ];
      
      // Ha nincs origin (pl. Postman), engedélyezzük
      if (!origin) {
        return callback(null, true);
      }
      
      // Ellenőrizzük, hogy az origin engedélyezett-e
      const isAllowed = allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') {
          return allowed === origin;
        }
        // Regex esetén
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

  // 🔥 SECURITY HEADERS
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    if (isProduction) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    
    next();
  });

  // Loggoló middleware
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      console.log(`[API Request] ${req.method} ${req.path}`);
    }
    next();
  });
  
  // Route-ok regisztrálása
  await registerRoutes(app);
  
  // Globális hibakezelő
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[Global Error Handler] Unhandled error on path: ${req.path}`, err);
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ message });
  });

  return app;
}

// ============================================
// MAGYARÁZAT:
// ============================================

// A regex pattern: /^https:\/\/.*\.onrender\.com$/
// Engedélyezi:
// ✅ https://otis-aprod.onrender.com
// ✅ https://aprod-app-kkcr.onrender.com
// ✅ https://barmilyen-nev.onrender.com
// ❌ http://malicious.com