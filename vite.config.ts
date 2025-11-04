import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },

  // === JAVÍTOTT RÉSZ ===

  // Beállítások a fejlesztői (dev) szerverhez
  server: {
    host: '0.0.0.0', // Vagy 'true'. Így fejlesztés közben is 0.0.0.0-n fut
    port: 5000 // Opcionális, ha fix portot akarsz fejlesztés közben
  },

  // Beállítások a production (preview) szerverhez
  // EZ A LEGFONTOSABB A RENDER SZÁMÁRA!
  preview: {
    host: '0.0.0.0', // Ez mondja meg a ViteExpress-nek, hogy 0.0.0.0-n fusson
    port: Number(process.env.PORT) || 5000 // Render ebből olvassa ki a portot
  }

  // =====================
});