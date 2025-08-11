import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeApp } from "firebase/app";
import "dotenv/config";

// ------------------------------------------------
// Ide másold a teljes konfigurációs objektumot, amit a Firebase generált
// ------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCWL9DwDE3_sWawO-cRjICh3FMU_kcItT8",
  authDomain: "aprod-otis-github.firebaseapp.com",
  projectId: "aprod-otis-github",
  storageBucket: "aprod-otis-github.firebasestorage.app",
  messagingSenderId: "570224780465",
  appId: "1:570224780465:web:f3a997ac594b3e1ee92e90",
  measurementId: "G-PCYV4JLDV9"
};
// ------------------------------------------------

// Inicializáld a Firebase alkalmazást a szerver-oldali kódban
const firebaseApp = initializeApp(firebaseConfig);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log('Starting server initialization...');
    const server = await registerRoutes(app);
    console.log('Routes registered successfully');

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error('Express error:', err);
      res.status(status).json({ message });
    });

    if (app.get("env") === "development") {
      console.log('Setting up Vite in development mode...');
      await setupVite(app, server);
    } else {
      console.log('Serving static files in production mode...');
      serveStatic(app);
    }

    const port = parseInt(process.env.PORT || '3000', 10);
    server.listen({
      port,
      host: "localhost"
}, () => {
  log(`serving on port ${port}`);
});
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();