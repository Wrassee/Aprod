import { createApp } from './app.js';
import ViteExpress from 'vite-express';

const PORT = Number(process.env.PORT) || 5000;
const MODE = process.env.NODE_ENV || 'development';

async function startServer() {
  try {
    const app = await createApp();
    
    // Javított hívás: Vissza a 3 argumentumos verzióra, ahogy a TypeScript kéri
    ViteExpress.listen(app, PORT, () => {
      // Ez a log csak azt mutatja meg, milyen porton fut
      // A host-ot (0.0.0.0 vs localhost) a vite.config.ts fogja beállítani
      console.log(`🚀 Server listening on port: ${PORT}`);
      console.log(`🔧 Vite-Express is running in ${MODE} mode.`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();