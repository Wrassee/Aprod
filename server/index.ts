// server/index.ts

import { createApp } from "./app.js";
import 'dotenv/config';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function startServer() {
  try {
    const app = await createApp();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
