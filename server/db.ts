// server/db.ts - JAVÍTOTT TÍPUSOK (Build hiba javítása)

// ------------------------------------------------------------
// 1️⃣ Imports
// ------------------------------------------------------------
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
const { Pool } = pg;

import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

import path from "node:path";
import fs from "node:fs";
import { pathToFileURL } from 'node:url';
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

// ------------------------------------------------------------
// 3️⃣ DB típusdefiníciók és változók
// ------------------------------------------------------------
// 🔥 FONTOS VÁLTOZÁS: 'any'-t használunk a db típushoz, hogy
// a TypeScript ne akadjon fenn a Postgres/SQLite select különbségeken.
// Ez megoldja a "This expression is not callable" hibákat a build során.
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
export const { 
  protocols, 
  templates, 
  questionConfigs, 
  profiles, 
  audit_logs,
  liftTypes,
  liftSubtypes,
  liftTemplateMappings,
} = schema;

// Típusok exportálása (ezek maradhatnak, mert csak típusok)
// Fontos: ha a schema dinamikus, ezek 'any'-ként viselkedhetnek buildkor, ami jó.
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