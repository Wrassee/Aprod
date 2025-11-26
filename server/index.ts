import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

// ESM helyettesítő __dirname-hez
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json({ limit: "15mb" }));
app.use(cors());

// ===============================
// STATIC FRONTEND (Vite build)
// ===============================

const distPath = path.join(__dirname, "..", "client");   // /dist/client

app.use(express.static(distPath));

app.get("*", (_, res) => {
    res.sendFile(path.join(distPath, "index.html"));
});

// ===============================
// SERVER START
// ===============================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
