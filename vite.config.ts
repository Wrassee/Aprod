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

    // 🔥 EZ KELL, KÜLÖNBEN LOCALHOSTON IS LEÁLL A FRONTEND!
    server: {
  host: "0.0.0.0",
  port: 5173,
},
preview: {
  host: "0.0.0.0",
  port: 4173,
},
  };
});
