import { createApp } from './app.js';
import ViteExpress from 'vite-express';

// 1. Ez indítja el a Frontend-et a háttérben (hogy ne kelljen külön ablak)
ViteExpress.config({
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development'
});

const PORT = Number(process.env.PORT) || 5000;
const MODE = process.env.NODE_ENV || 'development';

async function startServer() {
  const app = await createApp();

  if (MODE === 'production') {
    app.listen(PORT, () => {
      console.log(`🚀 Production server running on port ${PORT}`);
    });
  } else {
    ViteExpress.listen(app, PORT, () => {
      console.log(`🚀 Dev server running on port ${PORT}`);
    });
  }
}

startServer();