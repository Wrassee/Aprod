import { createApp } from './app.js';
import ViteExpress from 'vite-express';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const PORT = Number(process.env.PORT) || 5000;
const MODE = process.env.NODE_ENV || 'development';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dev módban indítjuk a Vite-et
if (MODE !== 'production') {
  ViteExpress.config();
}

async function startServer() {
  const app = await createApp();   // <<< NINCS PARAMÉTER!!!

  if (MODE === 'production') {
    // FRONTEND kiszolgálása
    const distPath = path.join(__dirname, '../dist');
    app.use(express.static(distPath));

    // SPA fallback (React/Vue/Svelte)
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });

    app.listen(PORT, () => {
      console.log(`🚀 Production server running on port ${PORT}`);
    });

  } else {
    // DEV mód → ViteExpress
    ViteExpress.listen(app, PORT, () => {
      console.log(`🚀 Dev server running on port ${PORT}`);
    });
  }
}

startServer();
