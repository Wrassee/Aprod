// server/app.ts - JAVÍTOTT VERZIÓ (CORS Engedélyezve)

import express from 'express';
import 'dotenv/config';
import { registerRoutes } from './routes.js';
import cors from 'cors'; // 🔥 ÚJ IMPORT

export async function createApp() {
  const app = express();

  // 🔥 EZT A RÉSZT HAGYTUK KI EDDIG! EZ KELL A TELEFONHOZ!
  app.use(cors({
    origin: '*', // Mindenhonnan engedjük a kérést (fejlesztéshez ez a legjobb)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  // ======================================================

  app.use(express.json());

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