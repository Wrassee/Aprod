import { createApp } from './app.js';
import ViteExpress from 'vite-express';

// PORT beolvasása (ez rendben volt)
const PORT = Number(process.env.PORT) || 5000;

// Host és mód beolvasása a Render környezeti változóiból
const HOST = '0.0.0.0'; // Ez a kulcs a Renderhez!
const MODE = process.env.NODE_ENV || 'development';

async function startServer() {
  try {
    const app = await createApp();
    
    // A 'listen' hívás javítása:
    // Átadjuk a HOST-ot (0.0.0.0) a PORT és a callback funkció közé.
    ViteExpress.listen(app, PORT, HOST, () => {
      // Javított logolás, ami a valós értékeket mutatja
      console.log(`🚀 Server listening on http://${HOST}:${PORT}`);
      console.log(`🔧 Vite-Express is running in ${MODE} mode.`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();