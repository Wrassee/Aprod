// src/types/niedervolt-devices.ts

// Ez az interfész változatlan maradt
export interface NiedervoltDevice {
  id: string;
  nameDE: string;
  nameHU: string;
}

// ====================================================================
// === MÓDOSÍTÁS KEZDETE: ÚJ ADATSTRUKTÚRA ===
// ====================================================================

// A NiedervoltMeasurement interfészt teljesen lecseréljük az újra
export interface NiedervoltMeasurement {
  deviceId: string;
  // 1. Névleges áram
  biztositek?: string;         // 1a - ÚJ (a régi 'sicherung' helyett)
  kismegszakito?: string;     // 1b - ÚJ (a régi 'ls' helyett)
  // 2. Típusjelzés
  tipusjelzes?: string;         // ÚJ (a régi 'merkmal' helyett)
  // 3. Szigetelés vizsgálat
  szigetelesNPE?: string;     // 3a - ÚJ
  szigetelesL1PE?: string;    // 3b - ÚJ
  szigetelesL2PE?: string;    // 3c - ÚJ
  szigetelesL3PE?: string;    // 3d - ÚJ
  // 4. Rövidzárási áram
  iccLN?: string;             // 4a - ÚJ
  iccLPE?: string;            // 4b - ÚJ
  // 5, 6, 7. FI relé
  fiIn?: string;
  fiDin?: string;             // A ΔIn tárolására használjuk
  fiTest?: string;
}

// Field labels for the table headers - Teljesen új struktúra
export interface FieldLabels {
  // Főcímek
  nevlegesAram: { de: string; hu: string };
  tipusjelzes: { de: string; hu: string };
  szigetelesVizsgalat: { de: string; hu: string };
  rovidzarasiAram: { de: string; hu: string };
  // Alcímek és önálló oszlopok
  biztositek: { de: string; hu: string };
  kismegszakito: { de: string; hu: string };
  npe: { de: string; hu: string };
  l1pe: { de: string; hu: string };
  l2pe: { de: string; hu: string };
  l3pe: { de: string; hu: string };
  ln: { de: string; hu: string };
  lpe: { de: string; hu: string };
  fiIn: { de: string; hu: string };
  fiDin: { de: string; hu: string };
  fiTest: { de: string; hu: string };
}

export const FIELD_LABELS: FieldLabels = {
  // Főcímek
  nevlegesAram: { de: 'Nennstrom (A)', hu: 'Névleges áram (A)' },
  tipusjelzes: { de: 'Merkmal', hu: 'Típusjelzés' },
  szigetelesVizsgalat: { de: 'Isolationsprüfung (MΩ)', hu: 'Szigetelés vizsgálat (MΩ)' },
  rovidzarasiAram: { de: 'Kurzschlussstrom (Icc)', hu: 'Rövidzárási áram (Icc)' },
  // Alcímek és önálló oszlopok
  biztositek: { de: 'Sicherung', hu: 'Biztosíték' },
  kismegszakito: { de: 'LS-Schalter', hu: 'Kismegszakító' },
  npe: { de: 'N-PE', hu: 'N-PE' },
  l1pe: { de: 'L1-PE', hu: 'L1-PE' },
  l2pe: { de: 'L2-PE', hu: 'L2-PE' },
  l3pe: { de: 'L3-PE', hu: 'L3-PE' },
  ln: { de: 'L-N', hu: 'L-N' },
  lpe: { de: 'L-PE', hu: 'L-PE' },
  fiIn: { de: 'FI In mA', hu: 'FI In (mA)' },
  fiDin: { de: 'FI ΔIn ms', hu: 'FI ΔIn (ms)' },
  fiTest: { de: 'FI Test', hu: 'FI teszt' },
};

// Dropdown options for common values - A kulcsok átnevezve
export const DROPDOWN_OPTIONS = {
  biztositek: ['6A', '10A', '13A', '16A', '20A', '25A', '32A', '40A', '50A', '63A'],
  kismegszakito: ['B6', 'B10', 'B13', 'B16', 'B20', 'B25', 'B32', 'C6', 'C10', 'C13', 'C16', 'C20', 'C25', 'C32'],
  fiTest: ['OK', 'NOK']
};

// ====================================================================
// === MÓDOSÍTÁS VÉGE ===
// ====================================================================


// Ez a lista változatlan maradt
export const GERMAN_DEVICES: NiedervoltDevice[] = [
  { id: 'antriebsmotor', nameDE: 'Antriebsmotor', nameHU: 'Motor vagy vezérlés' },
  { id: 'tuerantrieb1', nameDE: 'Türantriebsmotor 1', nameHU: 'Ajtó motor 1' },
  { id: 'tuerantrieb2', nameDE: 'Türantriebsmotor 2', nameHU: 'Ajtó motor 2' },
  { id: 'motorventil', nameDE: 'Motorgest. Ventil (hydr.)', nameHU: 'Motorvezérelt szelep (hydr.)' },
  { id: 'buendigmotor', nameDE: 'Bündigstellungsmotor', nameHU: 'Szintbeállító motor (hydr.)' },
  { id: 'schachtsteckdose', nameDE: 'Schachtsteckdose', nameHU: 'Konektor az aknában' },
  { id: 'schachtlicht', nameDE: 'Schachtbeleuchtung', nameHU: 'Aknavilágítás' },
  { id: 'pms', nameDE: 'PMS', nameHU: 'PMS' },
  { id: 'steckdose_mr', nameDE: 'Steckdose MR.', nameHU: 'Konektor a gépházban' },
  { id: 'fahrkorblight', nameDE: 'Fahrkorbbeleuchtung', nameHU: 'Kabinvilágítás' },
  { id: 'fotozelle', nameDE: 'Fotozelle', nameHU: 'Fotocella' },
  { id: 'weitester', nameDE: 'Weitestentfernter Sicherheitskontakt', nameHU: 'Biztonsági kör legtávolabbi pontja' },
  { id: 'andere', nameDE: 'Andere', nameHU: 'Egyéb' }
];