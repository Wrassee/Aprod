// server/config/local-templates.ts

// Helyi template konfigurációk
export interface LocalTemplate {
  id: string;
  name: string;
  name_de: string;
  type: 'unified' | 'questions' | 'protocol';
  language: 'multilingual' | 'hu' | 'de';
  path: string;
  description?: string;
  description_de?: string;
}

export const LOCAL_TEMPLATES: LocalTemplate[] = [
  {
    id: 'alap_egysegu',
    name: 'Alapértelmezett Egységes Sablon',
    name_de: 'Standard Einheitliche Vorlage',
    type: 'unified',
    language: 'multilingual',
    path: '/templates/alap_egysegu.xlsx',
    description: 'Általános célú sablon lift átvételi protokollhoz',
    description_de: 'Allzweck-Vorlage für Aufzugsabnahmeprotokoll'
  },
  {
    id: 'bovitett_kerdesek',
    name: 'Bővített Kérdések Sablon',
    name_de: 'Erweiterte Fragen Vorlage',
    type: 'questions',
    language: 'multilingual',
    path: '/templates/bovitett_kerdesek.xlsx',
    description: 'Részletes kérdéssor különleges lift típusokhoz',
    description_de: 'Detaillierter Fragebogen für spezielle Aufzugstypen'
  },
  {
    id: 'expressz_protokoll',
    name: 'Expressz Protokoll Sablon',
    name_de: 'Express Protokoll Vorlage',
    type: 'protocol',
    language: 'multilingual',
    path: '/templates/expressz_protokoll.xlsx',
    description: 'Gyors protokoll egyszerű lift típusokhoz',
    description_de: 'Schnelles Protokoll für einfache Aufzugstypen'
  },
  {
    id: 'teljes_dokumentacio',
    name: 'Teljes Dokumentáció Sablon',
    name_de: 'Vollständige Dokumentationsvorlage',
    type: 'unified',
    language: 'multilingual',
    path: '/templates/teljes_dokumentacio.xlsx',
    description: 'Komplett dokumentációs sablon minden funkcióval',
    description_de: 'Vollständige Dokumentationsvorlage mit allen Funktionen'
  },
  {
    id: 'minimal_kerdesek',
    name: 'Minimális Kérdések Sablon',
    name_de: 'Minimale Fragen Vorlage',
    type: 'questions',
    language: 'multilingual',
    path: '/templates/minimal_kerdesek.xlsx',
    description: 'Alapvető kérdések gyors átvételhez',
    description_de: 'Grundlegende Fragen für schnelle Abnahme'
  },
  {
    id: 'fejlett_szamitasok',
    name: 'Fejlett Számítások Sablon',
    name_de: 'Erweiterte Berechnungen Vorlage',
    type: 'unified',
    language: 'multilingual',
    path: '/templates/fejlett_szamitasok.xlsx',
    description: 'Fejlett mérési és számítási funkciókkal',
    description_de: 'Mit erweiterten Mess- und Berechnungsfunktionen'
  },

  // ===== EZ AZ ÚJ RÉSZ, AMIT HOZZÁADTUNK =====
  {
    id: 'alap_erdungskontrolle',
    name: 'Földelési Jegyzőkönyv Sablon (PDF)',
    name_de: 'Erdungsprotokoll Vorlage (PDF)',
    type: 'protocol',
    language: 'multilingual',
    path: '/templates/Erdungskontrolle.pdf',
    description: 'PDF űrlap sablon a kitöltött földelési jegyzőkönyv generálásához.',
    description_de: 'PDF-Formularvorlage zur Erstellung des ausgefüllten Erdungsprotokolls.'
  }
  // ==========================================
];

// Template prioritási sorrend: helyi -> localStorage cache -> Supabase letöltés
export enum TemplateLoadStrategy {
  LOCAL_FIRST = 'local_first',
  CACHE_FIRST = 'cache_first',
  REMOTE_ONLY = 'remote_only'
}

// Default betöltési stratégia
export const DEFAULT_LOAD_STRATEGY = TemplateLoadStrategy.LOCAL_FIRST;

// Megkeresi a helyi template-et ID alapján
export function findLocalTemplate(templateId: string): LocalTemplate | undefined {
  return LOCAL_TEMPLATES.find(template => template.id === templateId);
}

// Összes helyi template lekérése típus szerint
export function getLocalTemplatesByType(type: LocalTemplate['type']): LocalTemplate[] {
  return LOCAL_TEMPLATES.filter(template => template.type === type);
}

// Alapértelmezett template ID-k típusonként
export const DEFAULT_TEMPLATE_IDS = {
  unified: 'alap_egysegu',
  questions: 'minimal_kerdesek',
  protocol: 'expressz_protokoll'
} as const;