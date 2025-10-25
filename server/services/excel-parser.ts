// server/services/excel-parser.ts
import * as XLSX from 'xlsx';
import { readFile } from 'fs/promises';
import { QuestionType } from '../../shared/schema.js';

export interface ParsedQuestion {
  questionId: string;
  title: string;
  titleHu?: string;
  titleDe?: string;
  type: QuestionType;
  required: boolean;
  placeholder?: string;
  cellReference?: string;
  sheetName?: string;
  multiCell?: boolean;
  groupName?: string;
  groupNameDe?: string;
  groupKey?: string;  // NEW: Generated slug from groupName
  groupOrder?: number;
  conditionalGroupKey?: string;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  calculationFormula?: string;
  calculationInputs?: string;
  // === ÚJ MEZŐK HOZZÁADÁSA ===
  options?: string;
  maxLength?: number;
}

export interface TemplateInfo {
  name: string;
  language: string;
  type: string;
  version?: string;
}

class ExcelParserService {
  // --- SEGÉDFÜGGVÉNYEK ---

  /** Slug generálás magyar ékezetes karakterekkel */
  private slugify(text: string): string {
    if (!text) return 'default';
    
    // Magyar karakterek transliteráció
    const charMap: Record<string, string> = {
      'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ö': 'o', 'ő': 'o', 'ú': 'u', 'ü': 'u', 'ű': 'u',
      'Á': 'a', 'É': 'e', 'Í': 'i', 'Ó': 'o', 'Ö': 'o', 'Ő': 'o', 'Ú': 'u', 'Ü': 'u', 'Ű': 'u',
      'ä': 'a', 'ë': 'e', 'ï': 'i', 'ö': 'o', 'ü': 'u', 'ß': 'ss',
      'Ä': 'a', 'Ë': 'e', 'Ï': 'i', 'Ö': 'o', 'Ü': 'u'
    };
    
    return text
      .split('')
      .map(char => charMap[char] || char)
      .join('')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')  // Replace special chars with underscore
      .replace(/^_+|_+$/g, '')      // Remove leading/trailing underscores
      .replace(/_+/g, '_');         // Replace multiple underscores with single
  }

  /** Rugalmas fejléc-kereső: több alias nevet is felismer és a szóközöket is kezeli */
  private findHeaderIndex(headers: string[], ...variants: string[]): number {
    return headers.findIndex(h =>
      variants.some(v => h.toLowerCase().trim() === v.toLowerCase().trim())
    );
  }

  /** Egységes logika boolean értékek felismerésére */
  private parseBoolean(value: any): boolean {
    if (typeof value === 'string') {
      return ['true', 'yes', 'igen', 'ja', '1', 'x'].includes(value.toLowerCase().trim());
    }
    return !!value;
  }

  /** 
   * JAVÍTOTT típusértelmezés - minden típust külön kezel
   * Támogatja: text, textarea, select, phone, number, measurement, calculated, stb.
   */
  private parseQuestionType(raw?: string): QuestionType {
    if (!raw) return 'text';
    const t = raw.toLowerCase().trim();

    // Speciális radio/checkbox típusok
    if (['yes_no_na'].includes(t)) return 'yes_no_na';
    if (['yes_no', 'boolean', 'checkbox', 'igen_nem'].includes(t)) return 'checkbox';
    if (['true_false', 'radio', 'binary'].includes(t)) return 'radio';
    
    // Speciális számítási típusok
    if (['measurement', 'mérés', 'numeric_with_unit'].includes(t)) return 'measurement';
    if (['calculated', 'computed', 'számított', 'berechnet'].includes(t)) return 'calculated';
    
    // Alap input típusok
    if (['number', 'numeric', 'integer', 'float', 'decimal'].includes(t)) return 'number';
    
    // === ÚJ TÍPUSOK KÜLÖN KEZELÉSE ===
    if (['textarea', 'memo', 'multiline', 'longtext'].includes(t)) return 'textarea';
    if (['select', 'dropdown', 'list', 'választó'].includes(t)) return 'select';
    if (['phone', 'tel', 'telefon', 'telephone'].includes(t)) return 'phone';
    if (['email', 'e-mail', 'mail'].includes(t)) return 'email';
    if (['date', 'dátum', 'datum'].includes(t)) return 'date';
    if (['time', 'idő', 'zeit'].includes(t)) return 'time';
    if (['multi_select', 'multiselect', 'multiple'].includes(t)) return 'multi_select';
    
    // Alapértelmezett
    if (['text', 'string', 'str', 'szöveg'].includes(t)) return 'text';
    
    return 'text'; // Ha semmi sem illik, akkor sima szöveg
  }

  /** A különböző válaszokat Excel-kompatibilis értékre formázza */
  private formatAnswerForExcel(answer: any, type: QuestionType): any {
    switch (type) {
      case 'checkbox':
      case 'yes_no_na':
        if (answer === 'yes') return 'Igen';
        if (answer === 'no') return 'Nem';
        if (answer === 'na' || answer === 'n/a') return 'N/A';
        return answer;
        
      case 'radio':
      case 'true_false':
        if (answer === 'true' || answer === true) return 'X';
        if (answer === 'false' || answer === false) return '-';
        return answer;
        
      case 'measurement':
      case 'calculated':
      case 'number':
        const num = parseFloat(answer);
        return isNaN(num) ? answer : num;
        
      case 'select':
      case 'multi_select':
        // Ha tömb (multi_select), akkor vesszővel elválasztva
        if (Array.isArray(answer)) {
          return answer.join(', ');
        }
        return answer?.toString() || '';
        
      case 'date':
        // Dátum formázása ha szükséges
        if (answer instanceof Date) {
          return answer.toLocaleDateString('hu-HU');
        }
        return answer?.toString() || '';
        
      case 'phone':
      case 'email':
      case 'text':
      case 'textarea':
      case 'time':
      default:
        return answer?.toString() || '';
    }
  }

  // --- FŐ FÜGGVÉNY: Excel kérdések beolvasása ---
  async parseQuestionsFromExcel(filePath: string): Promise<ParsedQuestion[]> {
    try {
      console.log(`🔍 Parsing questions from: ${filePath}`);

      const fileBuffer = await readFile(filePath);
      const workbook = XLSX.read(fileBuffer, { 
        type: 'buffer',
        codepage: 65001 // UTF-8 kódolás ékezetes karakterekhez
      });

      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error('Excel file contains no sheets.');

      const worksheet = workbook.Sheets[sheetName];
      const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (data.length < 2) throw new Error('Excel file must contain header + at least one data row.');

      const headers = data[0].map((h: any) => String(h).trim());
      console.log(`📋 Headers found in Excel: [${headers.join(', ')}]`);

      // === KIBŐVÍTETT OSZLOPINDEX KERESÉS ===
      const colIndices = {
        ID: this.findHeaderIndex(headers, 'id', 'question_id', 'questionId', 'kérdés_id'),
        TITLE: this.findHeaderIndex(headers, 'title', 'name', 'név', 'kérdés'),
        TITLE_HU: this.findHeaderIndex(headers, 'title_hu', 'titleHu', 'magyar_cím'),
        TITLE_DE: this.findHeaderIndex(headers, 'title_de', 'titleDe', 'német_cím'),
        TYPE: this.findHeaderIndex(headers, 'type', 'típus', 'tipus'),
        OPTIONS: this.findHeaderIndex(headers, 'options', 'choices', 'választások', 'opciók'), // ÚJ
        MAX_LENGTH: this.findHeaderIndex(headers, 'maxlength', 'max_length', 'maxLength'), // ÚJ
        REQUIRED: this.findHeaderIndex(headers, 'required', 'kötelező', 'kell'),
        PLACEHOLDER: this.findHeaderIndex(headers, 'placeholder', 'description', 'leírás', 'leiras'),
        CELL_REF: this.findHeaderIndex(headers, 'cell_reference', 'cellReference', 'cella', 'cel'),
        SHEET_NAME: this.findHeaderIndex(headers, 'sheet_name', 'sheetName', 'munkalap'),
        MULTI_CELL: this.findHeaderIndex(headers, 'multi_cell', 'multiCell', 'több_cella'),
        GROUP_NAME: this.findHeaderIndex(headers, 'group_name', 'groupName', 'csoport'),
        GROUP_NAME_DE: this.findHeaderIndex(headers, 'group_name_de', 'groupNameDe', 'német_csoport'),
        GROUP_KEY: this.findHeaderIndex(headers, 'groupKey', 'group_key'), // NEW: Stable slug from Excel
        GROUP_ORDER: this.findHeaderIndex(headers, 'group_order', 'groupOrder', 'sorrend'),
        CONDITIONAL_GROUP_KEY: this.findHeaderIndex(headers, 'conditionalGroupKey', 'conditional_group_key'),
        UNIT: this.findHeaderIndex(headers, 'unit', 'egység', 'mértékegység'),
        MIN_VALUE: this.findHeaderIndex(headers, 'min_value', 'minValue', 'min'),
        MAX_VALUE: this.findHeaderIndex(headers, 'max_value', 'maxValue', 'max'),
        CALC_FORMULA: this.findHeaderIndex(headers, 'calculation_formula', 'calculationFormula', 'képlet'),
        CALC_INPUTS: this.findHeaderIndex(headers, 'calculation_inputs', 'calculationInputs', 'bemenetek')
      };
      
      // Debug információ
      console.log('📊 Column indices found:', {
        TYPE: colIndices.TYPE,
        OPTIONS: colIndices.OPTIONS,
        MAX_LENGTH: colIndices.MAX_LENGTH,
        CELL_REF: colIndices.CELL_REF
      });

      const questions: ParsedQuestion[] = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || colIndices.ID === -1 || !row[colIndices.ID]) continue;

        const questionType = this.parseQuestionType(
          colIndices.TYPE !== -1 ? String(row[colIndices.TYPE]) : 'text'
        );

        // === TELJES KÉRDÉS OBJEKTUM AZ ÚJ MEZŐKKEL ===
        const groupName = colIndices.GROUP_NAME !== -1 && row[colIndices.GROUP_NAME] 
          ? String(row[colIndices.GROUP_NAME]).trim() 
          : undefined;
        
        const q: ParsedQuestion = {
          questionId: String(row[colIndices.ID]).trim(),
          title: String(row[colIndices.TITLE] || row[colIndices.TITLE_HU] || row[colIndices.ID]),
          titleHu: colIndices.TITLE_HU !== -1 && row[colIndices.TITLE_HU] 
            ? String(row[colIndices.TITLE_HU]).trim() 
            : undefined,
          titleDe: colIndices.TITLE_DE !== -1 && row[colIndices.TITLE_DE] 
            ? String(row[colIndices.TITLE_DE]).trim() 
            : undefined,
          type: questionType,
          
          // === ÚJ MEZŐK ===
          options: colIndices.OPTIONS !== -1 && row[colIndices.OPTIONS] 
            ? String(row[colIndices.OPTIONS]).trim() 
            : undefined,
          maxLength: colIndices.MAX_LENGTH !== -1 && row[colIndices.MAX_LENGTH] 
            ? parseInt(String(row[colIndices.MAX_LENGTH])) 
            : undefined,
          
          // Többi mező
          required: colIndices.REQUIRED !== -1 
            ? this.parseBoolean(row[colIndices.REQUIRED]) 
            : false,
          placeholder: colIndices.PLACEHOLDER !== -1 && row[colIndices.PLACEHOLDER] 
            ? String(row[colIndices.PLACEHOLDER]).trim() 
            : undefined,
          cellReference: colIndices.CELL_REF !== -1 && row[colIndices.CELL_REF] 
            ? String(row[colIndices.CELL_REF]).trim() 
            : undefined,
          sheetName: colIndices.SHEET_NAME !== -1 && row[colIndices.SHEET_NAME] 
            ? String(row[colIndices.SHEET_NAME]).trim() 
            : sheetName,
          multiCell: colIndices.MULTI_CELL !== -1 
            ? this.parseBoolean(row[colIndices.MULTI_CELL]) 
            : false,
          groupName: groupName,
          groupNameDe: colIndices.GROUP_NAME_DE !== -1 && row[colIndices.GROUP_NAME_DE] 
            ? String(row[colIndices.GROUP_NAME_DE]).trim() 
            : undefined,
          // FIXED: Read groupKey from Excel first, fallback to auto-generate slug
          groupKey: (colIndices.GROUP_KEY !== -1 && row[colIndices.GROUP_KEY]) 
            ? String(row[colIndices.GROUP_KEY]).trim() 
            : (groupName ? this.slugify(groupName) : 'default'),
          groupOrder: colIndices.GROUP_ORDER !== -1 && row[colIndices.GROUP_ORDER] 
            ? parseInt(String(row[colIndices.GROUP_ORDER])) 
            : 0,
          conditionalGroupKey: colIndices.CONDITIONAL_GROUP_KEY !== -1 && row[colIndices.CONDITIONAL_GROUP_KEY] 
            ? String(row[colIndices.CONDITIONAL_GROUP_KEY]).trim() 
            : undefined,
          unit: colIndices.UNIT !== -1 && row[colIndices.UNIT] 
            ? String(row[colIndices.UNIT]).trim() 
            : undefined,
          minValue: colIndices.MIN_VALUE !== -1 && row[colIndices.MIN_VALUE] 
            ? parseFloat(String(row[colIndices.MIN_VALUE])) 
            : undefined,
          maxValue: colIndices.MAX_VALUE !== -1 && row[colIndices.MAX_VALUE] 
            ? parseFloat(String(row[colIndices.MAX_VALUE])) 
            : undefined,
          calculationFormula: colIndices.CALC_FORMULA !== -1 && row[colIndices.CALC_FORMULA] 
            ? String(row[colIndices.CALC_FORMULA]).trim() 
            : undefined,
          calculationInputs: colIndices.CALC_INPUTS !== -1 && row[colIndices.CALC_INPUTS] 
            ? String(row[colIndices.CALC_INPUTS]).trim() 
            : undefined,
        };
        
        // Debug információ az options-ről
        if (q.type === 'select' || q.type === 'multi_select') {
          console.log(`📝 Question ${q.questionId} (${q.type}) has options: ${q.options}`);
        }
        
        questions.push(q);
      }

      console.log(`✅ Successfully parsed ${questions.length} questions.`);
      
      // Statisztikák
      const stats = {
        total: questions.length,
        withCellRef: questions.filter(q => q.cellReference).length,
        withOptions: questions.filter(q => q.options).length,
        byType: {} as Record<string, number>
      };
      
      questions.forEach(q => {
        stats.byType[q.type] = (stats.byType[q.type] || 0) + 1;
      });
      
      console.log('📊 Parse statistics:', stats);
      
      return questions;
    } catch (error) {
      console.error('❌ Failed to parse Excel:', error);
      throw error;
    }
  }

  // --- METAADATOK KIOLVASÁSA ---
  async extractTemplateInfo(filePath: string): Promise<TemplateInfo> {
    try {
      const fileBuffer = await readFile(filePath);
      const workbook = XLSX.read(fileBuffer, { 
        type: 'buffer',
        codepage: 65001 // UTF-8 kódolás beállítása
      });
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const getCell = (cell: string) => worksheet[cell]?.v?.toString()?.trim() ?? '';

      return {
        name: getCell('B1') || sheetName,
        type: getCell('B2') || 'unified',
        version: getCell('B3') || '1.0',
        language: 'multilingual'
      };
    } catch (error) {
      console.error('Error extracting template info:', error);
      throw new Error('Failed to extract template information from Excel file.');
    }
  }

  // --- EXCEL KITÖLTÉSE A VÁLASZOKKAL ---
  async populateTemplate(
    templatePath: string,
    answers: Record<string, any>,
    questions: ParsedQuestion[]
  ): Promise<Buffer> {
    try {
      const fileBuffer = await readFile(templatePath);
      const workbook = XLSX.read(fileBuffer, { 
        type: 'buffer',
        codepage: 65001 // UTF-8, hogy az ékezetes szövegek ne torzuljanak
      });

      questions.forEach(question => {
        const answer = answers[question.questionId];
        if (!question.cellReference || answer === undefined || answer === null) return;

        const [sheetName, cellRef] = question.cellReference.includes('!')
          ? question.cellReference.split('!')
          : [question.sheetName || workbook.SheetNames[0], question.cellReference];

        if (sheetName && workbook.Sheets[sheetName]) {
          const worksheet = workbook.Sheets[sheetName];
          const value = this.formatAnswerForExcel(answer, question.type);
          
          // Cella típus meghatározása
          let cellType: string = 's'; // alapértelmezett: string
          if (typeof value === 'number') cellType = 'n';
          if (value instanceof Date) cellType = 'd';
          
          worksheet[cellRef] = { 
            v: value, 
            t: cellType,
            ...(cellType === 'd' && { z: 'yyyy-mm-dd' }) // dátum formázás
          };

          console.log(`🖋️ Filled ${sheetName}!${cellRef} for "${question.questionId}" (${question.type}) = ${value}`);
        }
      });

      return XLSX.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx',
        cellDates: true // dátumok helyes kezelése
      });
    } catch (error) {
      console.error('❌ Error populating Excel template:', error);
      throw new Error('Failed to populate Excel template');
    }
  }
}

export const excelParserService = new ExcelParserService();