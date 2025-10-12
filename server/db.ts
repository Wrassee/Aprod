// server/db.ts - VÉGLEGES, TELJES VERZIÓ

// ------------------------------------------------------------
// 1️⃣ Imports
// ------------------------------------------------------------
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import Database from "better-sqlite3";
import ws from "ws";
import path from "node:path";
import fs from "node:fs";
import { pathToFileURL } from 'node:url';
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

// ------------------------------------------------------------
// 3️⃣ DB típusdefiníciók és változók
// ------------------------------------------------------------
type SqliteDb = ReturnType<typeof drizzleSqlite>;
type NeonDb = ReturnType<typeof drizzleNeon>;
type DbType = SqliteDb | NeonDb;

let db: DbType;
let schema: any;
let testConnectionFn: () => Promise<boolean>;

// ------------------------------------------------------------
// 4️⃣ Production – Neon PostgreSQL
// ------------------------------------------------------------
if (process.env.NODE_ENV === "production") {
  console.log("🔧 Initializing Neon (PostgreSQL) connection – production mode");
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required in production.");
  }
  
  // ================= JAVÍTÁS KEZDETE =================
  // A dinamikus importot egy sima relatív importra cseréljük.
  // A build folyamat tudni fogja, hogy a `../shared/schema.js` fájlt kell betöltenie
  // a `dist/server/db.js`-ből.
  schema = await import("../shared/schema.js");
  // ================= JAVÍTÁS VÉGE ===================

  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzleNeon(pool, { schema });

  // Itt van a "production" függvény törzse
  testConnectionFn = async () => {
    try {
      await pool.query("SELECT 1");
      console.log("✅ Neon connection OK");
      return true;
    } catch (err) {
      console.error("❌ Neon connection failed:", err);
      return false;
    }
  };
}
// ------------------------------------------------------------
// 5️⃣ Development – SQLite (local)
// ------------------------------------------------------------
else {
  console.log("🔧 Initializing SQLite – development mode");
  const dbPath = path.join(process.cwd(), "data", "otis_aprod.db");
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const schemaPath = path.resolve(process.cwd(), 'shared/schema-sqlite.js');
  schema = await import(pathToFileURL(schemaPath).href);

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  db = drizzleSqlite(sqlite, { schema });

  // Itt van a "development" függvény törzse
  testConnectionFn = async () => {
    try {
      sqlite.prepare("SELECT 1").get();
      console.log("✅ SQLite connection OK");
      return true;
    } catch (err) {
      console.error("❌ SQLite connection failed:", err);
      return false;
    }
  };
}

// ------------------------------------------------------------
// 6️⃣ Re-export schema tables and types
// ------------------------------------------------------------
export const { protocols, templates, questionConfigs } = schema;

export type Protocol = InferSelectModel<typeof protocols>;
export type InsertProtocol = InferInsertModel<typeof protocols>;
export type Template = InferSelectModel<typeof templates>;
export type InsertTemplate = InferInsertModel<typeof templates>;
export type QuestionConfig = InferSelectModel<typeof questionConfigs>;
export type InsertQuestionConfig = InferInsertModel<typeof questionConfigs>;

// ------------------------------------------------------------
// 7️⃣ Exportálás
// ------------------------------------------------------------
export { db };
export const testConnection = testConnectionFn;