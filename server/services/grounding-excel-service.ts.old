// server/services/grounding-excel-service.ts
import JSZip from 'jszip';
import { templateLoader } from './template-loader.js';
import type { FormData } from '../../shared/types.js';

interface GroundingData {
  groups: GroundingGroup[];
}

interface GroundingGroup {
  id: string;
  title: string;
  questions: GroundingQuestion[];
}

interface GroundingQuestion {
  id: string;
  text: string;
}

export class GroundingExcelService {
  /**
   * Generate Excel report for grounding measurements using a specialized template
   */
  async generateGroundingExcel(formData: FormData, language: 'hu' | 'de'): Promise<Buffer> {
    try {
      console.log('GROUNDING: Starting grounding protocol Excel generation');
      
      // Load the grounding-specific template or protocol template
      console.log('GROUNDING: Loading protocol template...');
      const templateBuffer = await templateLoader.loadTemplateBuffer('protocol', language);
      
      // Load grounding questions for mapping
      const groundingData = await this.loadGroundingQuestions(language);
      
      // Process the template with grounding-specific data
      return await this.populateGroundingTemplate(templateBuffer, formData, groundingData, language);
      
    } catch (error) {
      console.error('GROUNDING: Error generating Excel:', error);
      throw error;
    }
  }

  private async loadGroundingQuestions(language: 'hu' | 'de'): Promise<GroundingData> {
    try {
      // In production/serverless, we need to read from the static assets
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const filePath = path.join(process.cwd(), 'public', `questions_grounding_${language}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('GROUNDING: Could not load grounding questions:', error);
      // Fallback with empty structure
      return { groups: [] };
    }
  }

  private async populateGroundingTemplate(
    templateBuffer: Buffer, 
    formData: FormData, 
    groundingData: GroundingData,
    language: 'hu' | 'de'
  ): Promise<Buffer> {
    try {
      const zip = await JSZip.loadAsync(templateBuffer);
      
      // Find the main worksheet
      const sheetFile = Object.keys(zip.files).find(name => 
        name.startsWith('xl/worksheets/') && name.endsWith('.xml')
      );
      
      if (!sheetFile) {
        throw new Error('No worksheet files found in Excel template');
      }

      let worksheetXml = await zip.file(sheetFile)!.async('text');
      
      // Create mappings for grounding check answers
      const cellMappings = this.createGroundingCellMappings(formData, groundingData, language);
      console.log(`GROUNDING: Created ${cellMappings.length} cell mappings`);
      
      // Apply the mappings to the worksheet XML
      let modifiedCount = 0;
      cellMappings.forEach(mapping => {
        const { cell, value } = mapping;
        const escapedValue = this.escapeXml(value);
        
        // Try to find and replace existing cell content
        const cellPattern = new RegExp(`(<c r="${cell}"[^>]*>)([^<]*)(</c>)`);
        
        if (cellPattern.test(worksheetXml)) {
          worksheetXml = worksheetXml.replace(cellPattern, `$1<is><t>${escapedValue}</t></is>$3`);
          modifiedCount++;
          console.log(`GROUNDING: Updated cell ${cell} with value: ${value}`);
        } else if (worksheetXml.includes(`<c r="${cell}" s="`)) {
          // Handle empty styled cells
          const styleMatch = worksheetXml.match(new RegExp(`<c r="${cell}" s="([^"]+)"/>`));
          if (styleMatch) {
            const styleValue = styleMatch[1];
            const replacement = `<c r="${cell}" s="${styleValue}" t="inlineStr"><is><t>${escapedValue}</t></is></c>`;
            worksheetXml = worksheetXml.replace(new RegExp(`<c r="${cell}" s="${styleValue}"/>`), replacement);
            modifiedCount++;
            console.log(`GROUNDING: Set value for empty styled cell ${cell}`);
          }
        }
      });
      
      console.log(`GROUNDING: Modified ${modifiedCount} cells total`);
      
      // Update the worksheet in the ZIP archive
      zip.file(sheetFile, worksheetXml);
      
      // Generate the final Excel buffer
      return await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
      
    } catch (error) {
      console.error('GROUNDING: Error during template population:', error);
      throw error;
    }
  }

  private createGroundingCellMappings(
    formData: FormData, 
    groundingData: GroundingData,
    language: 'hu' | 'de'
  ): Array<{ cell: string; value: string }> {
    const mappings: Array<{ cell: string; value: string }> = [];
    
    // Basic protocol info
    if (formData.receptionDate) {
      mappings.push({
        cell: 'C3', // Assuming reception date is in cell C3
        value: formData.receptionDate
      });
    }

    // Add grounding measurement results
    const answers = formData.groundingCheckAnswers || {};
    let currentRow = 50; // Starting row for grounding measurements section
    
    groundingData.groups.forEach(group => {
      // Add group title
      mappings.push({
        cell: `A${currentRow}`,
        value: group.title
      });
      currentRow += 1;
      
      group.questions.forEach(question => {
        const answer = answers[question.id];
        let displayValue = 'N/A';
        
        if (answer === true) {
          displayValue = 'OK';
        } else if (answer === false) {
          displayValue = language === 'hu' ? 'Nem OK' : 'Nicht OK';
        }
        
        mappings.push({
          cell: `A${currentRow}`, // Question text
          value: question.text
        });
        mappings.push({
          cell: `D${currentRow}`, // Result
          value: displayValue
        });
        
        currentRow += 1;
      });
      
      currentRow += 1; // Add space between groups
    });
    
    // Summary information
    const totalQuestions = groundingData.groups.reduce((sum, group) => sum + group.questions.length, 0);
    const totalAnswered = Object.keys(answers).length;
    const failedCount = Object.values(answers).filter(answer => answer === false).length;
    
    mappings.push({
      cell: 'A80', // Summary section
      value: language === 'hu' ? 'Földelési mérések összesítése:' : 'Erdungsmessungen Zusammenfassung:'
    });
    mappings.push({
      cell: 'A81',
      value: language === 'hu' 
        ? `Összes mérési pont: ${totalQuestions}` 
        : `Gesamte Messpunkte: ${totalQuestions}`
    });
    mappings.push({
      cell: 'A82',
      value: language === 'hu' 
        ? `Ellenőrzött pontok: ${totalAnswered}` 
        : `Geprüfte Punkte: ${totalAnswered}`
    });
    mappings.push({
      cell: 'A83',
      value: language === 'hu' 
        ? `Nem OK eredmények: ${failedCount}` 
        : `Nicht OK Ergebnisse: ${failedCount}`
    });

    return mappings;
  }

  private escapeXml(value: string): string {
    if (!value) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

export const groundingExcelService = new GroundingExcelService();