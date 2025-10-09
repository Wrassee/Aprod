import * as fs from "fs";
import * as path from "path";
import { storage } from "../storage.js";
import { supabaseStorage } from "./supabase-storage.js";
import { 
  LOCAL_TEMPLATES, 
  LocalTemplate, 
  findLocalTemplate,
  TemplateLoadStrategy,
  DEFAULT_LOAD_STRATEGY 
} from "../config/local-templates.js";

export interface HybridTemplateResult {
  filePath: string;
  isLocal: boolean;
  templateInfo: LocalTemplate | any;
  loadedFrom: 'local' | 'cache' | 'supabase';
}

export class HybridTemplateLoader {
  
  /**
   * Intelligens template betöltés: Helyi -> Cache -> Supabase
   */
  async loadTemplate(
    templateId: string, 
    type: string = 'unified', 
    language: string = 'multilingual',
    strategy: TemplateLoadStrategy = DEFAULT_LOAD_STRATEGY
  ): Promise<HybridTemplateResult> {
    
    console.log(`🔍 Loading template: ${templateId} (type: ${type}, language: ${language}, strategy: ${strategy})`);
    
    // 1. HELYI SABLON KERESÉSE
    if (strategy === TemplateLoadStrategy.LOCAL_FIRST || strategy === TemplateLoadStrategy.CACHE_FIRST) {
      const localTemplate = findLocalTemplate(templateId);
      
      if (localTemplate) {
        console.log(`📁 Found local template: ${localTemplate.name}`);
        
        // Helyi fájl elérési út build-elt alkalmazásban
        const localPath = this.getLocalTemplatePath(localTemplate.path);
        
        if (fs.existsSync(localPath)) {
          console.log(`✅ Using local template from: ${localPath}`);
          return {
            filePath: localPath,
            isLocal: true,
            templateInfo: localTemplate,
            loadedFrom: 'local'
          };
        } else {
          console.warn(`⚠️ Local template file not found: ${localPath}`);
        }
      }
    }
    
    // 2. CACHE-ELT FÁJL KERESÉSE (temp mappából)
    if (strategy !== TemplateLoadStrategy.REMOTE_ONLY) {
      const cachedResult = await this.tryLoadCachedTemplate(templateId, type, language);
      if (cachedResult) {
        return cachedResult;
      }
    }
    
    // 3. SUPABASE LETÖLTÉS ÉS CACHE-ELÉS
    console.log(`☁️ Loading template from Supabase...`);
    const remoteResult = await this.loadRemoteTemplate(templateId, type, language);
    
    if (remoteResult) {
      return remoteResult;
    }
    
    // 4. FALLBACK: Alapértelmezett helyi sablon
    return this.getFallbackTemplate(type);
  }
  
  /**
   * Helyi template fájl elérési útvonalának feloldása
   */
  private getLocalTemplatePath(relativePath: string): string {
    // Production: dist/templates/
    // Development: public/templates/
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (isDevelopment) {
      return path.join(process.cwd(), 'public', relativePath.replace(/^\//, ''));
    } else {
      return path.join(process.cwd(), 'dist', relativePath.replace(/^\//, ''));
    }
  }
  
  /**
   * Cache-elt template keresése
   */
  private async tryLoadCachedTemplate(
    templateId: string, 
    type: string, 
    language: string
  ): Promise<HybridTemplateResult | null> {
    try {
      const tempDir = path.join(process.cwd(), 'temp');
      const cachedFiles = fs.existsSync(tempDir) ? fs.readdirSync(tempDir) : [];
      
      // Keresünk cache-elt fájlt, ami tartalmazza a template ID-t
      const cachedFile = cachedFiles.find(fileName => 
        fileName.includes(templateId) || 
        fileName.includes(`${type}-${language}`)
      );
      
      if (cachedFile) {
        const cachedPath = path.join(tempDir, cachedFile);
        console.log(`💾 Using cached template: ${cachedPath}`);
        
        return {
          filePath: cachedPath,
          isLocal: false,
          templateInfo: { id: templateId, type, language },
          loadedFrom: 'cache'
        };
      }
    } catch (error) {
      console.warn('⚠️ Error checking cached templates:', error);
    }
    
    return null;
  }
  
  /**
   * Remote template letöltése Supabase-ről
   */
  private async loadRemoteTemplate(
    templateId: string, 
    type: string, 
    language: string
  ): Promise<HybridTemplateResult | null> {
    try {
      // Próbáljuk betölteni a database-ből
      let template;
      
      // Először konkrét template ID alapján
      if (templateId && templateId !== 'undefined') {
        template = await storage.getTemplate(templateId);
      }
      
      // Ha nincs konkrét ID, akkor aktív template keresése
      if (!template) {
        template = await storage.getActiveTemplate(type, language);
      }
      
      if (!template || !template.file_path) {
        console.warn(`⚠️ No remote template found for: ${templateId} (${type}/${language})`);
        return null;
      }
      
      // Letöltés és cache-elés
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempPath = path.join(tempDir, `template-${template.file_name}`);
      
      // Csak akkor töltjük le, ha még nem létezik helyben
      if (!fs.existsSync(tempPath)) {
        console.log(`📥 Downloading template from Supabase: ${template.file_path}`);
        
        // Multi-tier download strategy a korrupt fájlnevek kezelésére
        try {
          const { executeWithFilenameStrategies } = await import('../utils/filename-corrections.js');
          
          await executeWithFilenameStrategies(
            template.file_path,
            (path) => supabaseStorage.downloadFile(path, tempPath),
            'download'
          );
          
        } catch (error: any) {
          console.error(`💥 Template download failed for all strategies: ${template.file_path}`, error);
          throw new Error(`Failed to download template after trying multiple filename strategies: ${error?.message || error}`);
        }
        
      } else {
        console.log(`📄 Using existing cached file: ${tempPath}`);
      }
      
      return {
        filePath: tempPath,
        isLocal: false,
        templateInfo: template,
        loadedFrom: 'supabase'
      };
      
    } catch (error) {
      console.error('❌ Error loading remote template:', error);
      return null;
    }
  }
  
  /**
   * Fallback alapértelmezett template
   */
  private getFallbackTemplate(type: string): HybridTemplateResult {
    // Keresünk egy megfelelő helyi template-et fallback-ként
    const fallbackTemplates = LOCAL_TEMPLATES.filter(t => 
      t.type === type || t.type === 'unified'
    );
    
    const fallbackTemplate = fallbackTemplates[0] || LOCAL_TEMPLATES[0];
    const fallbackPath = this.getLocalTemplatePath(fallbackTemplate.path);
    
    console.log(`🔄 Using fallback template: ${fallbackTemplate.name}`);
    
    return {
      filePath: fallbackPath,
      isLocal: true,
      templateInfo: fallbackTemplate,
      loadedFrom: 'local'
    };
  }
  
  /**
   * Elérhető helyi template-ek listázása
   */
  getAvailableLocalTemplates(): LocalTemplate[] {
    return LOCAL_TEMPLATES.filter(template => {
      const localPath = this.getLocalTemplatePath(template.path);
      return fs.existsSync(localPath);
    });
  }
  
  /**
   * Template információk lekérése (helyi + remote)
   */
  async getAllAvailableTemplates(): Promise<{
    local: LocalTemplate[];
    remote: any[];
  }> {
    const localTemplates = this.getAvailableLocalTemplates();
    
    try {
      const remoteTemplates = await storage.getAllTemplates();
      return {
        local: localTemplates,
        remote: remoteTemplates || []
      };
    } catch (error) {
      console.warn('⚠️ Error fetching remote templates:', error);
      return {
        local: localTemplates,
        remote: []
      };
    }
  }
  // IDE ILLSZD BE AZ ÚJ FÜGGVÉNYT

  /**
   * Törli a teljes 'temp' mappát, ezzel érvénytelenítve az összes cache-elt sablont.
   */
  clearCache(): void {
    try {
      const tempDir = path.join(process.cwd(), 'temp');
      if (fs.existsSync(tempDir)) {
        console.log(`🗑️ Clearing template cache directory: ${tempDir}`);
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log(`✅ Cache directory cleared successfully.`);
      } else {
        console.log(`ℹ️ Cache directory not found, nothing to clear.`);
      }
    } catch (error) {
      console.error('❌ Error clearing template cache:', error);
    }
  }

// EZ A SOR MÁR LÉTEZIK, EZ UTÁN MÁR NE ÍRJ SEMMIT A CLASS-ON BELÜL
}

// Singleton instance
export const hybridTemplateLoader = new HybridTemplateLoader();