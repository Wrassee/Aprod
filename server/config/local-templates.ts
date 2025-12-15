// server/config/local-templates.ts - Dinamikus helyi sablon kezelés

import * as fs from 'fs';
import * as path from 'path';

export interface LocalTemplate {
  id: string;
  name: string;
  name_de: string;
  type: 'unified' | 'questions' | 'protocol';
  language: 'multilingual' | 'hu' | 'de';
  path: string;
  liftType?: string;
  description?: string;
  description_de?: string;
  isDefault?: boolean;
}

export interface TemplateRegistry {
  version: string;
  lastUpdated: string;
  templates: {
    questions: RegistryTemplate[];
    protocols: RegistryTemplate[];
  };
  settings: {
    loadStrategy: string;
    cacheEnabled: boolean;
    offlineSupport: boolean;
  };
}

interface RegistryTemplate {
  id: string;
  name: string;
  name_de: string;
  fileName: string;
  type: string;
  liftType?: string;
  description?: string;
  description_de?: string;
  isDefault?: boolean;
}

// Statikus helyi sablonok (fallback)
export const LOCAL_TEMPLATES: LocalTemplate[] = [
  {
    id: 'local-bex-questions',
    name: 'BEX Kérdések',
    name_de: 'BEX Fragen',
    type: 'questions',
    language: 'multilingual',
    path: '/templates/BEX FRAGEN.xlsx',
    liftType: 'BEX',
    description: 'BEX lift típus kérdéssablon',
    description_de: 'BEX Aufzugstyp Fragevorlage'
  },
  {
    id: 'local-abnahme-questions',
    name: 'Átvételi Kérdések',
    name_de: 'Abnahme Fragen',
    type: 'questions',
    language: 'multilingual',
    path: '/templates/Abnahme FRAGEN.xlsx',
    liftType: 'MOD',
    description: 'Általános átvételi kérdéssablon',
    description_de: 'Allgemeine Abnahme Fragevorlage',
    isDefault: true
  },
  {
    id: 'local-abnahme-protocol-de',
    name: 'Átvételi Protokoll (DE)',
    name_de: 'Abnahmeprotokoll (DE)',
    type: 'protocol',
    language: 'de',
    path: '/templates/Abnahmeprotokoll Leer DE.xlsx',
    liftType: 'MOD',
    description: 'Német nyelvű átvételi protokoll sablon',
    description_de: 'Deutschsprachige Abnahmeprotokoll Vorlage',
    isDefault: true
  },
  {
    id: 'local-bex-protocol',
    name: 'BEX Protokoll',
    name_de: 'BEX Protokoll',
    type: 'protocol',
    language: 'multilingual',
    path: '/templates/BEX-DE.xlsx',
    liftType: 'BEX',
    description: 'BEX lift típus protokoll sablon',
    description_de: 'BEX Aufzugstyp Protokollvorlage'
  },
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
    id: 'alap_erdungskontrolle',
    name: 'Földelési Jegyzőkönyv Sablon (PDF)',
    name_de: 'Erdungsprotokoll Vorlage (PDF)',
    type: 'protocol',
    language: 'multilingual',
    path: '/templates/Erdungskontrolle.pdf',
    description: 'PDF űrlap sablon a kitöltött földelési jegyzőkönyv generálásához.',
    description_de: 'PDF-Formularvorlage zur Erstellung des ausgefüllten Erdungsprotokolls.'
  }
];

// Template prioritási sorrend: helyi -> localStorage cache -> Supabase letöltés
export enum TemplateLoadStrategy {
  LOCAL_FIRST = 'local_first',
  CACHE_FIRST = 'cache_first',
  REMOTE_ONLY = 'remote_only'
}

export const DEFAULT_LOAD_STRATEGY = TemplateLoadStrategy.LOCAL_FIRST;

// Alapértelmezett template ID-k típusonként
export const DEFAULT_TEMPLATE_IDS = {
  unified: 'alap_egysegu',
  questions: 'local-abnahme-questions',
  protocol: 'local-abnahme-protocol-de'
} as const;

let cachedRegistry: TemplateRegistry | null = null;

export function loadTemplateRegistry(): TemplateRegistry | null {
  if (cachedRegistry) return cachedRegistry;
  
  try {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const registryPath = isDevelopment 
      ? path.join(process.cwd(), 'public', 'templates', 'template-registry.json')
      : path.join(process.cwd(), 'dist', 'templates', 'template-registry.json');
    
    if (fs.existsSync(registryPath)) {
      const content = fs.readFileSync(registryPath, 'utf-8');
      cachedRegistry = JSON.parse(content);
      console.log(`📋 Template registry loaded: ${cachedRegistry?.templates.questions.length} questions, ${cachedRegistry?.templates.protocols.length} protocols`);
      return cachedRegistry;
    }
  } catch (error) {
    console.warn('⚠️ Could not load template registry:', error);
  }
  
  return null;
}

export function getLoadStrategy(): TemplateLoadStrategy {
  const registry = loadTemplateRegistry();
  if (registry?.settings?.loadStrategy) {
    return registry.settings.loadStrategy as TemplateLoadStrategy;
  }
  return DEFAULT_LOAD_STRATEGY;
}

export function setLoadStrategy(strategy: TemplateLoadStrategy): boolean {
  try {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const registryPath = isDevelopment 
      ? path.join(process.cwd(), 'public', 'templates', 'template-registry.json')
      : path.join(process.cwd(), 'dist', 'templates', 'template-registry.json');
    
    let registry = loadTemplateRegistry();
    if (!registry) {
      registry = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString().split('T')[0],
        templates: { questions: [], protocols: [] },
        settings: { loadStrategy: strategy, cacheEnabled: true, offlineSupport: true }
      };
    }
    
    registry.settings.loadStrategy = strategy;
    registry.lastUpdated = new Date().toISOString().split('T')[0];
    
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
    cachedRegistry = registry;
    
    console.log(`✅ Load strategy updated to: ${strategy}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to save load strategy:', error);
    return false;
  }
}

export function findLocalTemplate(templateId: string): LocalTemplate | undefined {
  const registry = loadTemplateRegistry();
  
  if (registry) {
    const allRegistryTemplates = [
      ...registry.templates.questions,
      ...registry.templates.protocols
    ];
    
    const regTemplate = allRegistryTemplates.find(t => t.id === templateId);
    if (regTemplate) {
      return {
        id: regTemplate.id,
        name: regTemplate.name,
        name_de: regTemplate.name_de,
        type: regTemplate.type as LocalTemplate['type'],
        language: 'multilingual',
        path: `/templates/${regTemplate.fileName}`,
        liftType: regTemplate.liftType,
        description: regTemplate.description,
        description_de: regTemplate.description_de,
        isDefault: regTemplate.isDefault
      };
    }
  }
  
  return LOCAL_TEMPLATES.find(template => template.id === templateId);
}

export function getLocalTemplatesByType(type: LocalTemplate['type']): LocalTemplate[] {
  const registry = loadTemplateRegistry();
  const results: LocalTemplate[] = [];
  
  if (registry) {
    const registryType = type === 'protocol' ? 'protocols' : 'questions';
    const regTemplates = registry.templates[registryType] || [];
    
    for (const regTemplate of regTemplates) {
      if (type === 'unified' || regTemplate.type === type || 
          (type === 'questions' && registryType === 'questions') ||
          (type === 'protocol' && registryType === 'protocols')) {
        results.push({
          id: regTemplate.id,
          name: regTemplate.name,
          name_de: regTemplate.name_de,
          type: type,
          language: 'multilingual',
          path: `/templates/${regTemplate.fileName}`,
          liftType: regTemplate.liftType,
          description: regTemplate.description,
          description_de: regTemplate.description_de,
          isDefault: regTemplate.isDefault
        });
      }
    }
  }
  
  const staticTemplates = LOCAL_TEMPLATES.filter(template => template.type === type);
  
  for (const staticT of staticTemplates) {
    if (!results.find(r => r.id === staticT.id)) {
      results.push(staticT);
    }
  }
  
  return results;
}

export function getAllLocalTemplates(): LocalTemplate[] {
  const registry = loadTemplateRegistry();
  const results: LocalTemplate[] = [];
  
  if (registry) {
    for (const regTemplate of registry.templates.questions) {
      results.push({
        id: regTemplate.id,
        name: regTemplate.name,
        name_de: regTemplate.name_de,
        type: 'questions',
        language: 'multilingual',
        path: `/templates/${regTemplate.fileName}`,
        liftType: regTemplate.liftType,
        description: regTemplate.description,
        description_de: regTemplate.description_de,
        isDefault: regTemplate.isDefault
      });
    }
    
    for (const regTemplate of registry.templates.protocols) {
      results.push({
        id: regTemplate.id,
        name: regTemplate.name,
        name_de: regTemplate.name_de,
        type: 'protocol',
        language: 'multilingual',
        path: `/templates/${regTemplate.fileName}`,
        liftType: regTemplate.liftType,
        description: regTemplate.description,
        description_de: regTemplate.description_de,
        isDefault: regTemplate.isDefault
      });
    }
  }
  
  for (const staticT of LOCAL_TEMPLATES) {
    if (!results.find(r => r.id === staticT.id)) {
      results.push(staticT);
    }
  }
  
  return results;
}

export function checkLocalTemplateExists(relativePath: string): boolean {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const fullPath = isDevelopment 
    ? path.join(process.cwd(), 'public', relativePath.replace(/^\//, ''))
    : path.join(process.cwd(), 'dist', relativePath.replace(/^\//, ''));
  
  return fs.existsSync(fullPath);
}

export function getTemplateRegistrySettings() {
  const registry = loadTemplateRegistry();
  return registry?.settings || {
    loadStrategy: DEFAULT_LOAD_STRATEGY,
    cacheEnabled: true,
    offlineSupport: true
  };
}
