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
  groupOrder?: number;
  conditionalGroupKey?: string;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  calculationFormula?: string;
  calculationInputs?: string;
}

export interface TemplateInfo {
  name: string;
  language: string;
  type: string;
  version?: string;
}

class ExcelParserService {
  // --- SEGÉDFÜGGVÉNYEK ---

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

  /** Egységes típusértelmezés aliasokkal, 'text' fallback-kel */
  private parseQuestionType(raw?: string): QuestionType {
  if (!raw) return 'text';
  const t = raw.toLowerCase().trim();

  // JAVÍTÁS: A yes_no_na kapjon egy egyedi 'yes_no_na' típust, ne legyen checkbox
  if (['yes_no_na'].includes(t)) return 'yes_no_na'; 
  if (['yes_no', 'boolean', 'checkbox', 'igen_nem'].includes(t)) return 'checkbox';
  if (['true_false', 'radio', 'binary'].includes(t)) return 'radio';
    if (['measurement', 'mérés', 'numeric_with_unit'].includes(t)) return 'measurement';
    if (['calculated', 'computed', 'számított', 'berechnet'].includes(t)) return 'calculated';
    if (['number', 'numeric', 'integer', 'float'].includes(t)) return 'number';
    if (['text', 'string', 'str', 'textarea', 'memo'].includes(t)) return 'text';

    return 'text'; // Alapértelmezett típus, ha semmi sem illik
  }

  /** A különböző válaszokat Excel-kompatibilis értékre formázza */
  private formatAnswerForExcel(answer: any, type: QuestionType): any {
    switch (type) {
      case 'checkbox':
        if (answer === 'yes') return 'Igen';
        if (answer === 'no') return 'Nem';
        if (answer === 'na') return 'N/A';
        return answer;
      case 'radio':
        if (answer === 'true' || answer === true) return 'X';
        if (answer === 'false' || answer === false) return '-';
        return answer;
      case 'measurement':
      case 'calculated':
      case 'number':
        const num = parseFloat(answer);
        return isNaN(num) ? answer : num;
      case 'text':
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
      console.log(`📋 Header found in Excel: [${headers.join(', ')}]`);

      const colIndices = {
        ID: this.findHeaderIndex(headers, 'id', 'question_id', 'questionId'),
        TITLE: this.findHeaderIndex(headers, 'title'),
        TITLE_HU: this.findHeaderIndex(headers, 'title_hu', 'titleHu'),
        TITLE_DE: this.findHeaderIndex(headers, 'title_de', 'titleDe'),
        TYPE: this.findHeaderIndex(headers, 'type'),
        REQUIRED: this.findHeaderIndex(headers, 'required', 'kell'),
        PLACEHOLDER: this.findHeaderIndex(headers, 'placeholder', 'description', 'leiras'),
        CELL_REF: this.findHeaderIndex(headers, 'cell_reference', 'cellReference', 'cel'),
        SHEET_NAME: this.findHeaderIndex(headers, 'sheet_name', 'sheetName', 'munkalapneve'),
        MULTI_CELL: this.findHeaderIndex(headers, 'multi_cell', 'multiCell'),
        GROUP_NAME: this.findHeaderIndex(headers, 'group_name', 'groupName', 'blokkneve'),
        GROUP_NAME_DE: this.findHeaderIndex(headers, 'group_name_de', 'groupNameDe', 'blokknevede'),
        GROUP_ORDER: this.findHeaderIndex(headers, 'group_order', 'groupOrder', 'order'),
        CONDITIONAL_GROUP_KEY: this.findHeaderIndex(headers, 'conditionalGroupKey', 'conditional_group_key'),
        UNIT: this.findHeaderIndex(headers, 'unit'),
        MIN_VALUE: this.findHeaderIndex(headers, 'min_value', 'minValue', 'min'),
        MAX_VALUE: this.findHeaderIndex(headers, 'max_value', 'maxValue', 'max'),
        CALC_FORMULA: this.findHeaderIndex(headers, 'calculation_formula', 'calculationFormula', 'formula'),
        CALC_INPUTS: this.findHeaderIndex(headers, 'calculation_inputs', 'calculationInputs', 'inputs')
      };
      
      console.log('📊 Column indices found:', { CELL_REF_INDEX: colIndices.CELL_REF });

      const questions: ParsedQuestion[] = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || colIndices.ID === -1 || !row[colIndices.ID]) continue;

        const q: ParsedQuestion = {
            questionId: String(row[colIndices.ID]),
            title: String(row[colIndices.TITLE] || row[colIndices.ID]),
            titleHu: colIndices.TITLE_HU !== -1 ? String(row[colIndices.TITLE_HU]) : undefined,
            titleDe: colIndices.TITLE_DE !== -1 ? String(row[colIndices.TITLE_DE]) : undefined,
            type: this.parseQuestionType(String(row[colIndices.TYPE])),
            required: colIndices.REQUIRED !== -1 ? this.parseBoolean(row[colIndices.REQUIRED]) : false,
            placeholder: colIndices.PLACEHOLDER !== -1 ? String(row[colIndices.PLACEHOLDER]) : undefined,
            cellReference: colIndices.CELL_REF !== -1 ? String(row[colIndices.CELL_REF]) : undefined,
            sheetName: colIndices.SHEET_NAME !== -1 ? String(row[colIndices.SHEET_NAME]) : sheetName,
            multiCell: colIndices.MULTI_CELL !== -1 ? this.parseBoolean(row[colIndices.MULTI_CELL]) : false,
            groupName: colIndices.GROUP_NAME !== -1 ? String(row[colIndices.GROUP_NAME]) : undefined,
            groupNameDe: colIndices.GROUP_NAME_DE !== -1 ? String(row[colIndices.GROUP_NAME_DE]) : undefined,
            groupOrder: colIndices.GROUP_ORDER !== -1 ? parseInt(String(row[colIndices.GROUP_ORDER] || '0')) : 0,
            conditionalGroupKey: colIndices.CONDITIONAL_GROUP_KEY !== -1 ? String(row[colIndices.CONDITIONAL_GROUP_KEY]) : undefined,
            unit: colIndices.UNIT !== -1 ? String(row[colIndices.UNIT]) : undefined,
            minValue: colIndices.MIN_VALUE !== -1 && row[colIndices.MIN_VALUE] ? parseFloat(String(row[colIndices.MIN_VALUE])) : undefined,
            maxValue: colIndices.MAX_VALUE !== -1 && row[colIndices.MAX_VALUE] ? parseFloat(String(row[colIndices.MAX_VALUE])) : undefined,
            calculationFormula: colIndices.CALC_FORMULA !== -1 ? String(row[colIndices.CALC_FORMULA]) : undefined,
            calculationInputs: colIndices.CALC_INPUTS !== -1 ? String(row[colIndices.CALC_INPUTS]) : undefined,
        };
        questions.push(q);
      }

      console.log(`✅ Successfully parsed ${questions.length} questions.`);
      const withCellRef = questions.filter(q => q.cellReference).length;
      console.log(`📊 Questions with cellReference: ${withCellRef}/${questions.length}`);
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
      const getCell = (cell: string) => worksheet[cell]?.v?.toString() ?? '';

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
          worksheet[cellRef] = { v: value, t: typeof value === 'number' ? 'n' : 's' };

          console.log(`🖋️ Filled ${sheetName}!${cellRef} for Q_ID="${question.questionId}" with value: ${value}`);
        }
      });

      return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    } catch (error) {
      console.error('❌ Error populating Excel template:', error);
      throw new Error('Failed to populate Excel template');
    }
  }
}

export const excelParserService = new ExcelParserService();