// excel-service.ts
import * as XLSX from 'xlsx';
import type { FormData } from '../../shared/types.js';
import { storage } from '../storage.js';
import { simpleXmlExcelService } from './simple-xml-excel.js';
import { templateLoader } from './template-loader.js';

class ExcelService {
  async generateExcel(formData: FormData, language: string): Promise<Buffer> {
    try {
      console.log('Using XML-based Excel manipulation for perfect formatting preservation');
      return await simpleXmlExcelService.generateExcelFromTemplate(formData, language);
    } catch (xmlError) {
      console.error('XML-based approach failed, falling back to XLSX library:', xmlError);
      
      try {
        console.log('Loading template via Supabase Storage...');
        const templateBuffer = await templateLoader.loadTemplateBuffer('protocol', language);
        console.log(`Using XLSX fallback with loaded template (${templateBuffer.length} bytes)`);
        return await this.populateProtocolTemplate(templateBuffer, formData, language);
      } catch (templateError) {
        console.log('No protocol template found, using basic Excel creation');
        return await this.createBasicExcel(formData, language);
      }
    }
  }

  private async populateProtocolTemplate(templateBuffer: Buffer, formData: FormData, language: string): Promise<Buffer> {
  try {
    const workbook = XLSX.read(templateBuffer, { 
      type: 'buffer',
      cellStyles: true,
      cellHTML: false,
      sheetStubs: true
    });
    
    const sheetName = workbook.SheetNames[0];
    let worksheet = workbook.Sheets[sheetName];
    
    // 1. LÉPÉS: Kérdéskonfigok betöltése
    let questionConfigs: any[] = [];
    try {
      const questionsTemplate = await storage.getActiveTemplate('questions', language);
      if (questionsTemplate) {
        questionConfigs = await storage.getQuestionConfigsByTemplate(questionsTemplate.id);
        console.log('Loaded question configs:', questionConfigs.length);
      }
    } catch (error) {
      console.log('Could not load question configs:', error);
    }
    
    // 2. LÉPÉS: Most már futtathatjuk a hibakeresést és a feldolgozást
    console.log('BACKEND: Megkapott formData.answers kulcsok:', Object.keys(formData.answers)); // Log #1
    
    const cellMappings: Array<{cell: string, value: any, label: string}> = [];

    Object.entries(formData.answers).forEach(([questionId, answer]) => {
      const config = questionConfigs.find(q => q.questionId === questionId);
      
      // *** A HIBAKERESŐ LOGIKA HELYES HELYE ITT VAN ***
      // A ciklusban, miután már van `config` változónk
      if (questionId.startsWith('Q_NID_')) {
        console.log(`BACKEND: NIV adat feldolgozása: ID=${questionId}, Érték=${answer}`); // Log #2
        if (config) {
          console.log(`BACKEND: TALÁLAT! Ehhez a NIV adathoz van konfiguráció:`, config); // Log #3
        } else {
          console.log(`BACKEND: HIBA! Nincs konfiguráció a(z) "${questionId}" ID-hoz. Ellenőrizd az Excel template-et!`); // Log #4
        }
      }
      
      if (config && config.cellReference && answer !== '' && answer !== null && answer !== undefined) {
        cellMappings.push({
          cell: config.cellReference,
          value: answer,
          label: config.title || `Question ${questionId}`
        });
      }
    });
    
    // Aláírás mező
    if (formData.signatureName && !cellMappings.find(m => m.cell === 'F9')) {
      cellMappings.push({
        cell: 'F9',
        value: formData.signatureName,
        label: 'Signature name'
      });
    }
    
    // Cellák kitöltése
    let filledCells = 0;
    cellMappings.forEach(mapping => {
      const newValue = this.formatAnswer(mapping.value, language);
      const existingCell = worksheet[mapping.cell];

      worksheet[mapping.cell] = { 
        v: newValue,
        t: typeof newValue === 'number' ? 'n' : 's'
      };

      if (existingCell && existingCell.s) {
        worksheet[mapping.cell].s = existingCell.s;
      }

      filledCells++;
    });
    
    workbook.Sheets[sheetName] = worksheet;
    console.log(`Successfully filled ${filledCells} cells in the OTIS protocol template`);
    
    const buffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: true,
      cellStyles: true
      });
      
      return buffer;
    } catch (error) {
      console.error('Error populating protocol template:', error);
      throw error;
    }
  }

  private async createBasicExcel(formData: FormData, language: string): Promise<Buffer> {
    try {
      const workbook = XLSX.utils.book_new();
      const worksheetData = [
        ['OTIS Acceptance Protocol', '', '', ''],
        ['', '', '', ''],
        ['Reception Date:', formData.receptionDate, '', ''],
        ['Language:', language === 'hu' ? 'Hungarian' : 'German', '', ''],
        ['', '', '', ''],
        ['Questions and Answers:', '', '', ''],
        ['', '', '', ''],
      ];

      try {
        const questionsTemplate = await storage.getActiveTemplate('questions', language);
        if (questionsTemplate) {
          const questionConfigs = await storage.getQuestionConfigsByTemplate(questionsTemplate.id);
          
          Object.entries(formData.answers).forEach(([questionId, answer]) => {
            const config = questionConfigs.find((q: any) => q.questionId === questionId);
            const questionText = config ? 
              (language === 'hu' && config.titleHu ? config.titleHu :
               language === 'de' && config.titleDe ? config.titleDe :
               config.title) :
              `Question ${questionId}`;
              
            worksheetData.push([
              questionText,
              this.formatAnswer(answer, language),
              '',
              ''
            ]);
          });
        } else {
          Object.entries(formData.answers).forEach(([questionId, answer], index) => {
            const questionText = this.getQuestionText(questionId, language);
            worksheetData.push([
              `${index + 1}. ${questionText}`,
              this.formatAnswer(answer, language),
              '',
              ''
            ]);
          });
        }
      } catch (error) {
        console.error('Error getting question configs:', error);
        Object.entries(formData.answers).forEach(([questionId, answer], index) => {
          worksheetData.push([
            `Question ${questionId}`,
            this.formatAnswer(answer, language),
            '',
            ''
          ]);
        });
      }

      if (formData.errors && formData.errors.length > 0) {
        worksheetData.push(['', '', '', '']);
        worksheetData.push(['Error List:', '', '', '']);
        worksheetData.push(['', '', '', '']);
        
        formData.errors.forEach((error, index) => {
          worksheetData.push([
            `Error ${index + 1}:`,
            error.description,
            error.severity,
            ''
          ]);
          worksheetData.push([
            'Description:',
            error.description,
            '',
            ''
          ]);
          worksheetData.push(['', '', '', '']);
        });
      }

      worksheetData.push(['', '', '', '']);
      worksheetData.push(['Signature:', '', '', '']);
      if (formData.signatureName) {
        worksheetData.push(['Signed by:', formData.signatureName, '', '']);
      }
      worksheetData.push(['Date:', new Date().toLocaleDateString(), '', '']);

      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      worksheet['!cols'] = [
        { wch: 30 },
        { wch: 30 },
        { wch: 15 },
        { wch: 15 }
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Acceptance Protocol');

      const buffer = XLSX.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx',
        compression: true 
      });

      return buffer;
    } catch (error) {
      console.error('Error generating Excel:', error);
      throw new Error('Failed to generate Excel file');
    }
  }

  private getQuestionText(questionId: string, language: string): string {
    const questions: Record<string, Record<string, string>> = {
      q1: {
        hu: 'Lift telepítés kész?',
        de: 'Aufzuginstallation abgeschlossen?',
        en: 'Elevator installation complete?'
      },
      q2: {
        hu: 'Biztonsági rendszerek működnek?',
        de: 'Sicherheitssysteme funktionsfähig?',
        en: 'Safety systems operational?'
      },
      q3: {
        hu: 'Teherbírás (kg)',
        de: 'Tragfähigkeit (kg)',
        en: 'Load capacity (kg)'
      },
      q4: {
        hu: 'További megjegyzések',
        de: 'Zusätzliche Kommentare',
        en: 'Additional comments'
      },
      q5: {
        hu: 'Vészhelyzeti kommunikációs rendszer tesztelve?',
        de: 'Notfallkommunikationssystem getestet?',
        en: 'Emergency communication system tested?'
      },
      q6: {
        hu: 'Ajtó működés sima?',
        de: 'Türbetrieb reibungslos?',
        en: 'Door operation smooth?'
      },
      q7: {
        hu: 'Szint pontosság (mm)',
        de: 'Ebengenauigkeit (mm)',
        en: 'Floor level accuracy (mm)'
      },
      q8: {
        hu: 'Telepítési megjegyzések',
        de: 'Installationshinweise',
        en: 'Installation notes'
      }
    };

    return questions[questionId]?.[language] || questions[questionId]?.en || questionId;
  }

  private formatAnswer(answer: any, language: string): string {
    if (typeof answer === 'string') {
      switch (answer) {
        case 'yes':
          return language === 'hu' ? 'Igen' : language === 'de' ? 'Ja' : 'Yes';
        case 'no':
          return language === 'hu' ? 'Nem' : language === 'de' ? 'Nein' : 'No';
        case 'na':
          return language === 'hu' ? 'Nem alkalmazható' : language === 'de' ? 'Nicht zutreffend' : 'Not applicable';
        default:
          return answer;
      }
    }
    return answer?.toString() || '';
  }
}

export const excelService = new ExcelService();
