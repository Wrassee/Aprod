import { createApp } from './app.js';
import ViteExpress from 'vite-express';

const PORT = Number(process.env.PORT) || 5000;
const MODE = process.env.NODE_ENV || 'development';

if (MODE !== 'production') {
  ViteExpress.config();
}

async function startServer() {
  const app = await createApp({
    mode: MODE === 'production' ? 'production' : 'development'
  });

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
