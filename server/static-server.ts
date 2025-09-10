import express, { type Express, Request, Response, NextFunction } from "express";
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

export function serveStatic(app: Express) {
    // Megbízhatóan meghatározzuk a 'dist' mappa abszolút útvonalát.
    // Ez a módszer független a szerver futtatási környezetétől.
    const __filename = fileURLToPath(import.meta.url); // pl. /.../dist/server/static-server.js
    const __dirname = path.dirname(__filename);       // pl. /.../dist/server
    const distPath = path.resolve(__dirname, '..', '..', 'dist');   // Visszalépünk a projekt gyökeréig, majd a dist-be

    console.log(`[Static Server] Serving files from root directory: ${distPath}`);

    // Statikus fájlok (CSS, JS, képek) kiszolgálása a 'dist' mappából.
    // Ez a middleware automatikusan megtalálja pl. a '/logo.png' vagy '/assets/index.css' fájlokat.
    app.use(express.static(distPath));

    // "Catch-all" útvonal a kliensoldali routing (React Router) támogatásához.
    // Ennek az API útvonalak UTÁN kell lennie.
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
        // Ha a kérés az API-hoz szól, azt nem itt kezeljük, továbbadjuk.
        if (req.path.startsWith('/api')) {
            return next();
        }
        
        // Minden más esetben (pl. egy direkt link egy aloldalra) visszaküldjük a fő index.html fájlt,
        // hogy a React Router átvehesse az irányítást.
        const indexPath = path.resolve(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(404).send('index.html not found in dist directory');
        }
    });
}

