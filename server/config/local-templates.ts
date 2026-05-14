// server/config/local-templates.ts — Egyszerűsített helyi sablon kezelés
// EGYETLEN forrás: public/templates/template-registry.json
// Fájlnév változtatáshoz CSAK a registry JSON-t kell szerkeszteni, kód nem kell!

import * as fs from 'fs';
import * as path from 'path';

export interface LocalTemplate {
  id: string;
  name: string;
  name_de?: string;
  type: 'questions' | 'protocol' | 'unified';
  file: string;        // csak a fájlnév, pl. "Abnahme FRAGEN.xlsx"
  liftType?: string;
  isDefault?: boolean;
}

export interface TemplatePair {
  id: string;
  name: string;
  name_de?: string;
  liftType?: string;
  questionsTemplateId: string;
  protocolTemplateId: string;
  isDefault?: boolean;
}

interface TemplateRegistry {
  version: string;
  templates: Record<string, Omit<LocalTemplate, 'id'>>;
  pairs: TemplatePair[];
}

let cachedRegistry: TemplateRegistry | null = null;

function getRegistryPath(): string {
  const isDev = process.env.NODE_ENV !== 'production';
  return isDev
    ? path.join(process.cwd(), 'public', 'templates', 'template-registry.json')
    : path.join(process.cwd(), 'dist', 'templates', 'template-registry.json');
}

export function loadTemplateRegistry(): TemplateRegistry | null {
  if (cachedRegistry) return cachedRegistry;
  try {
    const registryPath = getRegistryPath();
    if (fs.existsSync(registryPath)) {
      const content = fs.readFileSync(registryPath, 'utf-8');
      cachedRegistry = JSON.parse(content);
      console.log(`📋 Template registry loaded: ${Object.keys(cachedRegistry?.templates || {}).length} templates, ${cachedRegistry?.pairs?.length || 0} pairs`);
      return cachedRegistry;
    }
  } catch (error) {
    console.warn('⚠️ Could not load template registry:', error);
  }
  return null;
}

/** Feloldja a fájlnevet teljes elérési útra (dev: public/, prod: dist/) */
export function getLocalTemplatePath(fileName: string): string {
  const isDev = process.env.NODE_ENV !== 'production';
  const base = isDev ? 'public' : 'dist';
  return path.join(process.cwd(), base, 'templates', fileName);
}

/** Ellenőrzi, hogy a helyi fájl ténylegesen létezik-e */
export function checkLocalTemplateExists(fileName: string): boolean {
  return fs.existsSync(getLocalTemplatePath(fileName));
}

/** Template keresés ID alapján */
export function findLocalTemplate(templateId: string): LocalTemplate | null {
  const registry = loadTemplateRegistry();
  if (!registry) return null;
  const entry = registry.templates[templateId];
  if (!entry) return null;
  return { id: templateId, ...entry };
}

/** Az összes helyi sablon listája */
export function getAllLocalTemplates(): LocalTemplate[] {
  const registry = loadTemplateRegistry();
  if (!registry) return [];
  return Object.entries(registry.templates).map(([id, entry]) => ({ id, ...entry }));
}

/** Helyi sablonok szűrve típus szerint */
export function getLocalTemplatesByType(type: LocalTemplate['type']): LocalTemplate[] {
  return getAllLocalTemplates().filter(t => t.type === type || t.type === 'unified');
}

/** Template párok (kérdés + protokoll kombináció) */
export function getTemplatePairs(): TemplatePair[] {
  const registry = loadTemplateRegistry();
  return registry?.pairs || [];
}

/** Registry cache invalidálása (pl. ha a JSON-t módosítjuk) */
export function invalidateRegistryCache(): void {
  cachedRegistry = null;
  console.log('🔄 Template registry cache cleared');
}
