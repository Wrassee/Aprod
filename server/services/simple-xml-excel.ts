// server/services/simple-xml-excel.ts
import JSZip from 'jszip';
import { storage } from '../storage.js';
import { templateLoader } from './template-loader.js';
import type { FormData } from '../../shared/types.js';

class SimpleXmlExcelService {
  async generateExcelFromTemplate(formData: FormData, language: string): Promise<Buffer> {
    try {
      console.log('XML: Loading protocol template...');
      const templateBuffer = await templateLoader.loadTemplateBuffer('protocol', language);
      
      let questionConfigs: any[] = [];
      const questionsTemplate = await storage.getActiveTemplate('unified', 'multilingual') ?? await storage.getActiveTemplate('questions', language);
      if (questionsTemplate) {
        questionConfigs = await storage.getQuestionConfigsByTemplate(questionsTemplate.id);
        console.log(`Loaded ${questionConfigs.length} question configs.`);
      } else {
        console.warn('No active question template found!');
      }

      return await this.replaceInXmlArchive(templateBuffer, formData, questionConfigs, language);
    } catch (error) {
      console.error('XML Excel service error:', error);
      throw error;
    }
  }
  
  private async replaceInXmlArchive(
    templateBuffer: Buffer, 
    formData: FormData, 
    questionConfigs: any[], 
    language: string
  ): Promise<Buffer> {
    try {
      const zip = await JSZip.loadAsync(templateBuffer);
      const cellMappings = this.createCellMappings(formData, questionConfigs, language);
      
      const sheetFile = Object.keys(zip.files).find(name => name.startsWith('xl/worksheets/') && name.endsWith('.xml'));
      if (!sheetFile) throw new Error('No worksheet files found in Excel template');

      let worksheetXml = await zip.file(sheetFile)!.async('text');
      let modifiedCount = 0;

      cellMappings.forEach(mapping => {
        const { cell, value } = mapping;
        const escapedValue = this.escapeXml(value);
        const cellPattern = new RegExp(`(<c r="${cell}"[^>]*>)([^<]*)(</c>)`);

        if (cellPattern.test(worksheetXml)) {
          worksheetXml = worksheetXml.replace(cellPattern, `$1<is><t>${escapedValue}</t></is>$3`);
          modifiedCount++;
        } else if (worksheetXml.includes(`<c r="${cell}" s="`)) {
          const styleMatch = worksheetXml.match(new RegExp(`<c r="${cell}" s="([^"]+)"/>`));
          if (styleMatch) {
            const styleValue = styleMatch[1];
            const replacement = `<c r="${cell}" s="${styleValue}" t="inlineStr"><is><t>${escapedValue}</t></is></c>`;
            worksheetXml = worksheetXml.replace(new RegExp(`<c r="${cell}" s="${styleValue}"/>`), replacement);
            modifiedCount++;
          }
        } else {
            console.warn(`XML: Could not find pattern for cell ${cell}`);
        }
      });

      zip.file(sheetFile, worksheetXml);
      return await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    } catch (error) {
      console.error('Error during XML replacement:', error);
      throw error;
    }
  }

  // VÉGSŐ, EGYSZERŰSÍTETT createCellMappings - cellReference formátum alapú döntéssel
  private createCellMappings(formData: FormData, questionConfigs: any[], language: string): Array<{cell: string, value: string, label: string}> {
    const mappings: Array<{cell: string, value: string, label: string}> = [];
    
    console.log(`📊 createCellMappings: ${Object.keys(formData.answers).length} answers, ${questionConfigs.length} configs`);
    console.log(`📊 Answer keys sample: ${Object.keys(formData.answers).slice(0, 5).join(', ')}`);
    console.log(`📊 Config IDs sample: ${questionConfigs.slice(0, 3).map(q => `id=${q.id}, qId=${q.questionId}`).join(' | ')}`);
    
    Object.entries(formData.answers).forEach(([key, answer]) => {
      const config = questionConfigs.find(q => String(q.id) === key || q.questionId === key || String(q.question_id) === key);

      if (!config) {
        console.log(`⚠️ No config found for answer key: ${key}`);
        return; 
      }
      
      if (answer === null || answer === '' || answer === undefined) {
        return; 
      }
      
      // select_extended nem használ cellReference-t, hanem optionCells-t
      const cellRef = config.cellReference || config.cell_reference;
      if (config.type !== 'select_extended' && !cellRef) {
        console.log(`⚠️ No cellReference for key: ${key}, type: ${config.type}`);
        return;
      }
      
      console.log(`✅ Processing: key=${key}, type=${config.type}, cellRef=${cellRef}, answer=${answer}`);
      
      const type = config.type;
      const finalCellRef = cellRef ? String(cellRef) : '';
      
      // ====================== VÉGSŐ, EGYSZERŰSÍTETT LOGIKA ======================

      // 0. ESET: select_extended típus - minden opciónak saját cellája van
      if (type === 'select_extended' && config.optionCells && config.options) {
        const optionsArr = String(config.options).split(',').map((o: string) => o.trim());
        const cellsArr = String(config.optionCells).split(',').map((c: string) => c.trim());
        
        if (optionsArr.length === cellsArr.length) {
          cellsArr.forEach((cell, index) => {
            // Ha ez a kiválasztott opció, "X"-et írunk, különben "-"-t
            const value = (answer === optionsArr[index]) ? 'X' : '-';
            mappings.push({ cell, value, label: `select_extended ${key}` });
            console.log(`🖋️ select_extended ${cell} = "${value}" (option: ${optionsArr[index]}, selected: ${answer})`);
          });
        } else {
          console.warn(`⚠️ select_extended mismatch for "${key}": options(${optionsArr.length}) != cells(${cellsArr.length})`);
        }
        return; // Kész, tovább a következőre
      }

      // 1. ESET: Többcellásnak TŰNŐ kérdés.
      // Ha a cellahivatkozás vesszőt tartalmaz, azt MINDIG többcellásként kezeljük,
      // függetlenül a típustól és a multiCell flagtől. Ez a legbiztosabb jel.
      if (finalCellRef.includes(',')) {
        const cellRefs = finalCellRef.split(',').map((c: string) => c.trim());
        if (cellRefs.length >= 2) {
          const [yesCells, noCells, naCells] = cellRefs;
          
          const applyX = (cells: string) => {
            if (!cells) return;
            cells.split(';').forEach(cell => {
              if (cell) mappings.push({ cell: cell.trim(), value: 'X', label: `Question ${key}` });
            });
          };

          if (answer === 'yes') applyX(yesCells);
          else if (answer === 'no') applyX(noCells);
          else if (answer === 'na' && naCells) applyX(naCells);
        }
      }
      // 2. ESET: Egycellás 'true/false' (radio)
      else if (type === 'radio') {
        const cellValue = (answer === 'true' || answer === true) ? 'X' : '-';
        mappings.push({ cell: finalCellRef, value: cellValue, label: `Question ${key}` });
      } 
      // 3. ESET: Minden más egycellás kérdés (szöveg, szám, egycellás yes_no_na)
      else {
        const formattedValue = this.formatAnswer(answer, language);
        mappings.push({ cell: finalCellRef, value: formattedValue, label: `Question ${key}` });
      }
      // ======================================================================
    });
    
    // Hibák hozzáadása
    if (formData.errors && formData.errors.length > 0) {
      formData.errors.forEach((error, index) => {
        const row = 737 + index;
        mappings.push({ cell: `A${row}`, value: `${index + 1}`, label: `Error Number` });
        mappings.push({ cell: `D${row}`, value: error.description, label: `Error Description` });
        const severity = error.severity === 'critical' ? 'Kritikus' : error.severity === 'medium' ? 'Közepes' : 'Alacsony';
        mappings.push({ cell: `K${row}`, value: severity, label: `Error Severity` });
      });
    }
    
    return mappings;
  }

  private formatAnswer(answer: any, language: string): string {
    if (answer === null || answer === undefined) return '';
    
    // Boolean vagy string boolean értékek kezelése
    if (answer === true || answer === 'true') return language === 'hu' ? 'Igen' : 'Yes';
    if (answer === false || answer === 'false') return language === 'hu' ? 'Nem' : 'No';
    
    // yes/no/na string értékek kezelése
    if (answer === 'yes') return language === 'hu' ? 'Igen' : 'Yes';
    if (answer === 'no') return language === 'hu' ? 'Nem' : 'No';
    if (answer === 'na') return 'N/A';
    
    // Minden más esetben string-ként kezeljük
    return String(answer);
  }

  private escapeXml(text: string): string {
    if (typeof text !== 'string') text = String(text);
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }
}

export const simpleXmlExcelService = new SimpleXmlExcelService();