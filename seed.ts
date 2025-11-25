// seed.ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './shared/schema-sqlite'; // FONTOS: Az SQLite sémát importáljuk!
import { exit } from 'process';

// Csatlakozás a helyi adatbázishoz (a drizzle.config.ts alapján)
const sqlite = new Database('./data/otis_aprod.db');
const db = drizzle(sqlite, { schema });

// 1. A feltöltendő fő típusok
const mainTypes = [
  { 
    code: 'MOD', 
    name_hu: 'Modernizáció', 
    name_de: 'Modernisierung', 
    description_hu: 'Meglévő lift korszerűsítése', 
    description_de: 'Modernisierung eines bestehenden Aufzugs', 
    sort_order: 1 
  },
  { 
    code: 'BEX', 
    name_hu: 'Teljes szanálás', 
    name_de: 'BEX komplett', 
    description_hu: 'Teljes liftkicserélés', 
    description_de: 'Kompletter Austausch des Aufzugs', 
    sort_order: 2 
  },
  { 
    code: 'NEU', 
    name_hu: 'Új építés', 
    name_de: 'Neubau', 
    description_hu: 'Új lift telepítése', 
    description_de: 'Installation eines neuen Aufzugs', 
    sort_order: 3 
  },
  { 
    code: 'EGYEDI', 
    name_hu: 'Egyedi protokoll', 
    name_de: 'Benutzerdefiniert', 
    description_hu: 'Egyedi, feltöltött protokoll', 
    description_de: 'Benutzerdefiniertes Protokoll', 
    sort_order: 4 
  }
];

// Fő seedelő funkció
async function seed() {
  console.log('🌱 Kezdőadatok (seed) feltöltése...');

  // 1. LÉPÉS: Fő típusok feltöltése
  console.log('Feltöltés: lift_types...');
  await db.insert(schema.liftTypes)
    .values(mainTypes)
    .onConflictDoNothing(); // Ha már létezik a 'code', nem csinál semmit

  console.log('✅ Fő típusok feltöltve. Altípusok előkészítése...');

  // 2. LÉPÉS: Fő típusok ID-jainak lekérdezése
  const types = await db.query.liftTypes.findMany({
    columns: { id: true, code: true }
  });

  const typeMap = new Map(types.map(t => [t.code, t.id]));
  
  const modId = typeMap.get('MOD');
  const bexId = typeMap.get('BEX');
  const neuId = typeMap.get('NEU');
  const egyediId = typeMap.get('EGYEDI');

  if (!modId || !bexId || !neuId || !egyediId) {
    console.error('❌ Hiba: Nem található az összes fő típus ID-ja. Leállás.');
    exit(1);
  }

  // 3. LÉPÉS: Altípusok definiálása a lekérdezett ID-kkal
  const subtypes = [
    // MOD
    { lift_type_id: modId, code: 'MOD_DR', name_hu: 'Drótköteles', name_de: 'Seilaufzug', sort_order: 1 },
    { lift_type_id: modId, code: 'MOD_BELT', name_hu: 'Hajtásszíjas', name_de: 'Riemenantrieb', sort_order: 2 },
    { lift_type_id: modId, code: 'MOD_HYD', name_hu: 'Hidraulikus', name_de: 'Hydraulisch', sort_order: 3 },
    // BEX
    { lift_type_id: bexId, code: 'BEX_GEN2', name_hu: 'Gen2', name_de: 'Gen2', sort_order: 1 },
    { lift_type_id: bexId, code: 'BEX_GEN360', name_hu: 'Gen360', name_de: 'Gen360', sort_order: 2 },
    // NEU
    { lift_type_id: neuId, code: 'NEU_GEN2', name_hu: 'Gen2', name_de: 'Gen2', sort_order: 1 },
    { lift_type_id: neuId, code: 'NEU_GEN360', name_hu: 'Gen360', name_de: 'Gen360', sort_order: 2 },
    // EGYEDI
    { lift_type_id: egyediId, code: 'EGYEDI_CUSTOM', name_hu: 'Egyedi protokoll', name_de: 'Benutzerdefiniert', sort_order: 1 },
  ];

  // 4. LÉPÉS: Altípusok feltöltése
  console.log('Feltöltés: lift_subtypes...');
  await db.insert(schema.liftSubtypes)
    .values(subtypes)
    .onConflictDoNothing(); // Ez (lift_type_id, code) alapján működik, de SQLite-ban a unique index számít

  console.log('✅ Altípusok feltöltve.');
  console.log('🎉 Seedelés befejezve!');
}

// Script futtatása és hibakezelés
seed()
  .catch((e) => {
    console.error('❌ Hiba történt a seedelés közben:', e);
    exit(1);
  })
  .finally(() => {
    // Adatbázis kapcsolat bezárása
    sqlite.close();
  });