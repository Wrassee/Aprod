import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  // A dokumentációd alapján a SQLite séma fájlod itt található:
  schema: './shared/schema-sqlite.ts',
  // A Drizzle ide generálja a migrációs fájlokat:
  out: './drizzle',
  // Itt adod meg a helyi adatbázis fájl helyét:
  dbCredentials: {
    url: './data/otis_aprod.db',
  },
  verbose: true,
  strict: true,
});