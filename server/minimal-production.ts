// Minimal production server – no Vite dependencies
import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { createServer, type Server } from "http";
import fs from "fs";
import path from "path";

import { storage } from "./storage.js";
import { testConnection } from "./db.js";

const app = express();

/* -------------------------------------------------------------------------
 *  Export for server‑less deployment (e.g. Vercel, AWS Lambda)
 * ----------------------------------------------------------------------- */
export default app;

/* -------------------------------------------------------------------------
 *  Helper – timestamped log
 * ----------------------------------------------------------------------- */
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

/* -------------------------------------------------------------------------
 *  Serve the built front‑end (dist/public)
 * ----------------------------------------------------------------------- */
function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}. Run the client build first.`,
    );
  }

  // Static assets
  app.use(express.static(distPath));

  // Fallback – SPA index.html
  app.use("*", (_req: Request, res: Response) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

/* -------------------------------------------------------------------------
 *  Middlewares
 * ----------------------------------------------------------------------- */
// 🔧 Increased limit for high-DPI mobile signatures (Samsung Fold5, etc.)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request‑logging middleware (only for /api routes)
app.use((req, res, next) => {
  const start = Date.now();
  const requestPath = req.path;
  let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

  const originalJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson as Record<string, unknown>;
    return originalJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (requestPath.startsWith("/api")) {
      let line = `${req.method} ${requestPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        line += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (line.length > 80) line = line.slice(0, 79) + "…";
      log(line);
    }
  });

  next();
});

/* -------------------------------------------------------------------------
 *  Register API routes – returns an http.Server
 * ----------------------------------------------------------------------- */
async function registerRoutes(app: Express): Promise<Server> {
  // Verify DB connectivity before exposing any endpoint
  console.log("Testing database connection...");
  const dbConnected = await testConnection();
  if (!dbConnected) {
    throw new Error("Database connection failed");
  }

  // -----------------------------------------------------------------------
  //  Health check
  // -----------------------------------------------------------------------
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", environment: "production" });
  });

  // -----------------------------------------------------------------------
  //  Questions (localized)
  // -----------------------------------------------------------------------
  app.get("/api/questions/:lang", async (req: Request, res: Response) => {
    try {
      const lang = (req.params.lang as string) ?? "hu";
      const questions = await storage.getQuestions(lang);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  // -----------------------------------------------------------------------
  //  Admin – templates
  // -----------------------------------------------------------------------
  app.get("/api/admin/templates", async (_req: Request, res: Response) => {
    try {
      // **FIX**: storage.getTemplates() nem létezik. A helyes metódus
      // a projektben már definiált `getAllTemplates()` (vagy hasonló).
      // Ha a nevét másra cserélted, frissítsd itt is ugyanezzel.
      const templates = await storage.getAllTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  // Return a plain Node http.Server (needed for server‑less adapters)
  return createServer(app);
}

/* -------------------------------------------------------------------------
 *  Server bootstrap – runs only when not in a server‑less environment
 * ----------------------------------------------------------------------- */
(async () => {
  try {
    console.log("Starting production server…");
    const server = await registerRoutes(app);
    console.log("Routes registered successfully");

    // Global error handler (must be added *after* routes)
    app.use(
      (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
        const e = err as {
          status?: number;
          statusCode?: number;
          message?: string;
        };
        const status = e.status || e.statusCode || 500;
        const message = e.message || "Internal Server Error";
        console.error("Express error:", err);
        res.status(status).json({ message });
      },
    );

    // Serve the SPA assets
    console.log("Enabling static file serving (production mode)…");
    serveStatic(app);

    // -----------------------------------------------------------------------
    //  Server‑less detection – Vercel, AWS Lambda, etc.
    // -----------------------------------------------------------------------
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      console.log(
        "Running in a server‑less environment – not starting HTTP listener",
      );
      return;
    }

    // -----------------------------------------------------------------------
    //  Traditional HTTP listener
    // -----------------------------------------------------------------------
    const PORT = Number(process.env.PORT) || 5000;
    server.listen(
      {
        port: PORT,
        host: "0.0.0.0",
        reusePort: true,
      },
      () => {
        log(`serving on port ${PORT}`);
      },
    );
  } catch (error) {
    console.error("Failed to start production server:", error);
    process.exit(1);
  }
})();