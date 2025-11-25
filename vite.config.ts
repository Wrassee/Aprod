import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: mode === 'development' ? '/' : './',

    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },

    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_APP_URL': JSON.stringify(env.VITE_APP_URL),
    },

    // 🔥 MÓDOSÍTOTT RÉSZ:
    server: {
      host: "0.0.0.0",
      port: 5173,
      // Itt engedélyezzük a Renderes domaineket
      allowedHosts: [
        'aprod-app-kkcr.onrender.com', // A jelenlegi teszt oldal
        'aprod.onrender.com',          // A jövőbeli éles oldal
        'localhost'
      ],
    },
    preview: {
      host: "0.0.0.0",
      port: 4173,
      // Biztonság kedvéért a preview módhoz is hozzáadjuk
      allowedHosts: [
        'aprod-app-kkcr.onrender.com',
        'aprod.onrender.com',
        'localhost'
      ],
    },
  };
});