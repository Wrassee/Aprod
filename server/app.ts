// server/app.ts - JAVASOLT, VÉGLEGES VERZIÓ

import express from 'express';
import 'dotenv/config'; // Fontos, hogy ez legyen az egyik első import
import { registerRoutes } from './routes.js';

export async function createApp() {
  const app = express();
  app.use(express.json());

  // Loggoló middleware a bejövő kérésekhez
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      console.log(`[API Request] ${req.method} ${req.path}`);
    }
    next();
  });
  
  // Route-ok regisztrálása, megvárjuk, amíg befejeződik
  await registerRoutes(app);
  
  // === JAVASOLT KIEGÉSZÍTÉS ===
  // Globális hibakezelő middleware, ami elkap minden nem lekezelt hibát a route-okból.
  // Ezt mindig a route-ok regisztrálása UTÁN kell elhelyezni.
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[Global Error Handler] Unhandled error on path: ${req.path}`, err);
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ message });
  });
  // ============================

  return app;
}