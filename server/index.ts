import { createApp } from './app.js';
import ViteExpress from 'vite-express';

// 1. Ez indítja el a Frontend-et a háttérben (hogy ne kelljen külön ablak)
ViteExpress.config({ mode: 'development' });

const PORT = Number(process.env.PORT) || 5000;
const MODE = process.env.NODE_ENV || 'development';

async function startServer() {
  try {
    const app = await createApp();
    
    // 2. A "0.0.0.0" paraméter miatt lesz elérhető a telefonról is!
    ViteExpress.listen(app, PORT, () => {
      console.log(`🚀 Server listening on port: ${PORT} (Host: 0.0.0.0)`);
      console.log(`🔧 Vite-Express is running in ${MODE} mode.`);
      console.log(`📱 Local access: http://localhost:${PORT}`);
      // Itt kiírhatod a saját IP-det is emlékeztetőnek, ha akarod
    }).on('error', (err) => {
      console.error("❌ Server error:", err);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();