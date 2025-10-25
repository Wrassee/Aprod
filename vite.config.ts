import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  // === EZ AZ ÚJ RÉSZ ===
  server: {
    // Engedélyezi a megadott Replit hostot
    allowedHosts: [
      'f812feab-a2a3-4e27-872f-1058f90528cb-00-n994xzkf5aps.kirk.replit.dev',
    ],
    // Ez a beállítás is gyakran szükséges Replitben,
    // hogy a szerver elérhető legyen a preview ablakból:
    host: true, // Vagy '0.0.0.0'
  },
  // =====================
});
