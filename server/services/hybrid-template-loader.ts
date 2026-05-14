// server/services/hybrid-template-loader.ts — Egyszerűsített 2-lépéses template betöltő
// [1] Helyi fájl (public/templates/) → [2] Supabase DB (admin által feltöltött)

import * as fs from "fs";
import * as path from "path";
import { storage } from "../storage.js";
import { supabaseStorage } from "./supabase-storage.js";
import {
  LocalTemplate,
  findLocalTemplate,
  getLocalTemplatePath,
  getAllLocalTemplates,
  checkLocalTemplateExists,
} from "../config/local-templates.js";

export interface HybridTemplateResult {
  filePath: string;
  isLocal: boolean;
  templateInfo: LocalTemplate | any;
  loadedFrom: 'local' | 'supabase';
}

export class HybridTemplateLoader {

  /**
   * Template betöltés: Helyi fájl → Supabase DB
   * A fájlnév kizárólag a template-registry.json-ban van definiálva.
   */
  async loadTemplate(
    templateId: string,
    type: string = 'unified',
    language: string = 'multilingual'
  ): Promise<HybridTemplateResult> {
    console.log(`🔍 Loading template: ${templateId}`);

    // [1] HELYI FÁJL — public/templates/ (vagy dist/templates/ production-ban)
    const localTemplate = findLocalTemplate(templateId);
    if (localTemplate) {
      const filePath = getLocalTemplatePath(localTemplate.file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ Local template: ${localTemplate.file}`);
        return { filePath, isLocal: true, templateInfo: localTemplate, loadedFrom: 'local' };
      }
      console.warn(`⚠️ Local template file missing: ${filePath}`);
    }

    // [2] SUPABASE DB — admin által feltöltött sablon
    const remoteResult = await this.loadFromSupabase(templateId, type, language);
    if (remoteResult) return remoteResult;

    throw new Error(`Template not found: "${templateId}". Add the file to public/templates/ and register it in template-registry.json`);
  }

  /** Supabase-ről tölt le és ideiglenesen cache-el a temp/ mappába */
  private async loadFromSupabase(
    templateId: string,
    type: string,
    language: string
  ): Promise<HybridTemplateResult | null> {
    try {
      let template = (templateId && templateId !== 'undefined')
        ? await storage.getTemplate(templateId)
        : null;

      if (!template) {
        template = await storage.getActiveTemplate(type, language);
      }

      if (!template?.file_path) {
        console.warn(`⚠️ No Supabase template for: ${templateId} (${type}/${language})`);
        return null;
      }

      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const tempPath = path.join(tempDir, `template-${template.file_name}`);

      if (!fs.existsSync(tempPath)) {
        console.log(`📥 Downloading from Supabase: ${template.file_path}`);
        const { executeWithFilenameStrategies } = await import('../utils/filename-corrections.js');
        await executeWithFilenameStrategies(
          template.file_path,
          (p: string) => supabaseStorage.downloadFile(p, tempPath),
          'download'
        );
      } else {
        console.log(`📄 Using cached Supabase template: ${tempPath}`);
      }

      return { filePath: tempPath, isLocal: false, templateInfo: template, loadedFrom: 'supabase' };
    } catch (error) {
      console.error('❌ Supabase template load failed:', error);
      return null;
    }
  }

  /** Supabase cache törlése (temp/ mappa) */
  clearCache(): void {
    try {
      const tempDir = path.join(process.cwd(), 'temp');
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log('✅ Supabase template cache cleared (temp/)');
      }
    } catch (error) {
      console.error('❌ Error clearing template cache:', error);
    }
  }

  /** Elérhető helyi sablonok (aminek a fájlja ténylegesen létezik) */
  getAvailableLocalTemplates(): LocalTemplate[] {
    return getAllLocalTemplates().filter(t => checkLocalTemplateExists(t.file));
  }

  /** Minden elérhető sablon (helyi + Supabase) — admin felülethez */
  async getAllAvailableTemplates(): Promise<{ local: LocalTemplate[]; remote: any[] }> {
    const local = this.getAvailableLocalTemplates();
    try {
      const remote = await storage.getAllTemplates();
      return { local, remote: remote || [] };
    } catch {
      return { local, remote: [] };
    }
  }
}

export const hybridTemplateLoader = new HybridTemplateLoader();
