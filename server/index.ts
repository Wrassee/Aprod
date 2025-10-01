import { createApp } from './app.js';
import ViteExpress from 'vite-express';

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    const app = await createApp();
    
    ViteExpress.listen(app, PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
      console.log(`🔧 Vite-Express is running in development mode.`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
