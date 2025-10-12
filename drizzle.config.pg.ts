// drizzle.config.pg.ts
import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// A Render környezetben is betöltjük a .env fájlt, ha létezik
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("❌ Missing DATABASE_URL environment variable!");
  process.exit(1);
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
