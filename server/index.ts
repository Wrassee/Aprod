/**
 * SERVER ENTRY (server/index.ts)
 * Render + ViteExpress + Capacitor kompatibilis, stabil verzió
 */

import { createApp } from './app.js';
import ViteExpress from 'vite-express';

const PORT = Number(process.env.PORT) || 5000;
const MODE = process.env.NODE_ENV === 'production' ? 'production' : 'development';

// Development ONLY: enable Vite middleware
if (MODE === 'development') {
  // 🔥 FIX: Üres objektum paraméter a ViteExpress.config() számára
  ViteExpress.config({});
}

async function startServer() {
  // 🔥 FIX: Paraméter átadása createApp-nak
  const app = await createApp({
    mode: MODE,
  });

  if (MODE === 'production') {
    // Render + Node production mód
    app.listen(PORT, () => {
      console.log(`🚀 Production server running on port ${PORT}`);
    });
  } else {
    // Local dev + Vite hot reload
    ViteExpress.listen(app, PORT, () => {
      console.log(`🚀 Dev server running on port ${PORT}`);
    });
  }
}

startServer();