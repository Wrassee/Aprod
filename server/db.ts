// server/db.ts - JAVÍTOTT (Dynamic Import Fix)

// ------------------------------------------------------------
// 1️⃣ Imports
// ------------------------------------------------------------
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
const { Pool } = pg;

// ❌ KIVETTÜK INNEN A SQLITE IMPORTKAT
// (Ezeket lejjebb, dinamikusan töltjük be, hogy ne omoljon össze élesben)

import path from "node:path";
import fs from "node:fs";
import { pathToFileURL } from 'node:url';
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

// ------------------------------------------------------------
// 3️⃣ DB típusdefiníciók és változók
// ------------------------------------------------------------
let db: any; 
let schema: any;
let testConnectionFn: () => Promise<boolean>;

const forcePostgres = !!process.env.DATABASE_URL;

// ------------------------------------------------------------
// 4️⃣ Production / Cloud Database (PostgreSQL / Supabase)
// ------------------------------------------------------------
if (process.env.NODE_ENV === "production" || forcePostgres) {
  console.log("🔧 Initializing Postgres Connection (Supabase)...");
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required.");
  }
  
  // Schema betöltése
  schema = await import("../shared/schema.js");

  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
  });
  
  db = drizzle(pool, { schema });

  testConnectionFn = async () => {
    try {
      const client = await pool.connect();
      await client.query("SELECT 1");
      client.release();
      console.log("✅ Postgres (Supabase) connection OK");
      return true;
    } catch (err) {
      console.error("❌ Postgres connection failed:", err);
      return false;
    }
  };
}
// ------------------------------------------------------------
// 5️⃣ Fallback – SQLite (local file)
// ------------------------------------------------------------
else {
  console.log("⚠️ No DATABASE_URL found. Fallback to SQLite (local file).");

  // 🔥 ÚJ RÉSZ: DINAMIKUS IMPORT
  // Csak akkor töltjük be a modulokat, ha tényleg itt vagyunk.
  // Így a szerver nem keresi a better-sqlite3-at éles környezetben.
  const { drizzle: drizzleSqlite } = await import("drizzle-orm/better-sqlite3");
  const { default: Database } = await import("better-sqlite3");

  const dbPath = path.join(process.cwd(), "data", "otis_aprod.db");
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const schemaPath = path.resolve(process.cwd(), 'shared/schema-sqlite.js');
  schema = await import(pathToFileURL(schemaPath).href);

  // Itt a 'Database' már a dinamikusan importált osztály
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  db = drizzleSqlite(sqlite, { schema });

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
// Mivel a schema dinamikusan van betöltve, ellenőrizzük, hogy létezik-e, mielőtt destrukturáljuk.
// (Bár a fenti await import miatt elvileg mindig léteznie kell).
const safeSchema = schema || {};

export const { 
  protocols, 
  templates, 
  questionConfigs, 
  profiles, 
  audit_logs,
  liftTypes,
  liftSubtypes,
  liftTemplateMappings,
} = safeSchema;

// Típusok exportálása
export type Protocol = any;
export type InsertProtocol = any;
export type Template = any;
export type InsertTemplate = any;
export type QuestionConfig = any;
export type InsertQuestionConfig = any;
export type Profile = any;
export type InsertProfile = any;
export type AuditLog = any;
export type InsertAuditLog = any;
export type LiftType = any;
export type InsertLiftType = any;
export type LiftSubtype = any;
export type InsertLiftSubtype = any;
export type LiftTemplateMapping = any;
export type InsertLiftTemplateMapping = any;

// ------------------------------------------------------------
// 7️⃣ Exportálás
// ------------------------------------------------------------
export { db, schema };
export const testConnection = testConnectionFn;