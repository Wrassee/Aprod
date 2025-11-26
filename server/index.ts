import express from "express";
import path from "path";
import cors from "cors";

// Ha szükséges: importálhatóak itt az API endpointjaid
// import { router as protocolRouter } from "./routes/protocol";

const app = express();

// Backend JSON kezelés
app.use(express.json({ limit: "10mb" }));
app.use(cors());

// ===============================
// API ROUTES
// ===============================
// app.use("/api/protocol", protocolRouter);

// ===============================
// STATIC FRONTEND kiszolgálás
// (Vite build - dist/)
// ===============================
const distPath = path.join(__dirname, "..", "client"); // dist/client
app.use(express.static(distPath));

// Ha nem talál API route-ot → SPA fallback
app.get("*", (_, res) => {
    res.sendFile(path.join(distPath, "index.html"));
});

// ===============================
// SERVER INDÍTÁSA
// Render mindig beállít egy PORT változót
// ===============================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
