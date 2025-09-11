import { storage } from '../storage.js';
import { supabaseStorage } from './supabase-storage.js';
import * as fs from 'fs/promises'; // Aszinkron fs modul használata
import path from 'path';

/**
 * Helper service to load templates from Supabase Storage
 */
export class TemplateLoaderService {
 
  /**
   * Loads the buffer of an active template file from Supabase Storage.
   * This is the single, reliable method for fetching templates in production.
   * @param type - Template type (protocol, questions, etc.)
   * @param language - Language code or 'multilingual'
   * @returns Buffer with template data
   */
  async loadTemplateBuffer(type: string, language: string): Promise<Buffer> {
    console.log(`TemplateLoader: Attempting to load active template type="${type}", language="${language}"`);

    // 1. Get template metadata from the database.
    // The getActiveTemplate function already handles the multilingual fallback logic.
    const template = await storage.getActiveTemplate(type, language);

    if (!template || !template.file_path || !template.file_name) {
      console.error(`TemplateLoader: No active template with a valid file_path found for type="${type}".`);
      throw new Error(`No active template found for type: ${type}`);
    }

    const storagePath = template.file_path;
    const fileName = template.file_name;
    
    // The Dockerfile creates this writable temp directory at /app/temp
    const tempDir = '/app/temp'; 
    const tempFilePath = path.join(tempDir, `download-${Date.now()}-${fileName}`);

    try {
      // 2. Download the file from Supabase Storage to the temporary path.
      console.log(`TemplateLoader: Downloading from Supabase ("${storagePath}") to temp file ("${tempFilePath}")...`);
      await supabaseStorage.downloadFile(storagePath, tempFilePath);
      console.log('TemplateLoader: Download complete.');

      // 3. Read the downloaded file into a buffer.
      const buffer = await fs.readFile(tempFilePath);
      console.log(`TemplateLoader: Template file read into buffer, size: ${buffer.length} bytes.`);
      
      return buffer;

    } catch (error) {
      console.error('TemplateLoader: Critical error during template download or file read process.', error);
      throw new Error(`Failed to load template file from storage: ${fileName}`);
    } finally {
      // 4. Clean up: Always try to delete the temporary file.
      try {
        await fs.unlink(tempFilePath);
        console.log(`TemplateLoader: Cleaned up temporary file: ${tempFilePath}`);
      } catch (cleanupError) {
        // This is not a critical error, so we just log a warning.
        console.warn(`TemplateLoader: Failed to clean up temporary file: ${tempFilePath}`, cleanupError);
      }
    }
  }

  /**
   * Checks if a template exists in storage.
   * @param type - Template type
   * @param language - Language code
   * @returns Boolean indicating if the template exists.
   */
  async templateExists(type: string, language: string): Promise<boolean> {
    try {
      const template = await storage.getActiveTemplate(type, language);
      if (!template || !template.file_path) {
        return false;
      }
      // The most reliable check is to see if the file exists in Supabase storage.
      return await supabaseStorage.fileExists(template.file_path);
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const templateLoader = new TemplateLoaderService();

