// drizzle.config.sqlite.ts
import type { Config } from 'drizzle-kit';

export default {
  out: './migrations/sqlite', // Külön mappa az SQLite migrációknak
  schema: './shared/schema-sqlite.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/otis_aprod.db',
  },
  verbose: true,
  strict: true,
} satisfies Config;