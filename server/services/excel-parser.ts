// server/services/excel-parser.ts
import * as XLSX from 'xlsx';
import { readFile } from 'fs/promises';
import { QuestionType } from '../../shared/schema.js';

export interface ParsedQuestion {
  questionId: string;
  
  // ===== JAVÍTOTT TÖBBNYELVŰ MODELL =====
  // title, placeholder, groupName = FALLBACK/TECHNIKAI mezők
  // titleHu/De/En/Fr/It = EXPLICIT nyelvspecifikus mezők
  title?: string;              // Fallback - NEM magyar!
  titleHu?: string;            // Magyar cím
  titleDe?: string;            // Német cím
  titleEn?: string;            // Angol cím
  titleFr?: string;            // Francia cím
  titleIt?: string;            // Olasz cím
  
  type: QuestionType;
  required: boolean;
  
  placeholder?: string;        // Fallback - NEM magyar!
  placeholderHu?: string;      // Magyar placeholder
  placeholderDe?: string;
  placeholderEn?: string;
  placeholderFr?: string;
  placeholderIt?: string;
  
  cellReference?: string;
  sheetName?: string;
  multiCell?: boolean;
  
  groupName?: string;          // Fallback - NEM magyar!
  groupNameHu?: string;        // Magyar csoportnév
  groupNameDe?: string;
  groupNameEn?: string;
  groupNameFr?: string;
  groupNameIt?: string;
  
  groupKey?: string;
  groupOrder?: number;
  conditionalGroupKey?: string;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  calculationFormula?: string;
  calculationInputs?: string;
  
  // Opciók (NEM nyelvfüggő - technikai értékek)
  options?: string;
  
  // select_extended típushoz: cellák az egyes opciókhoz (vesszővel elválasztva, sorrendben megegyezik az options-szel)
  optionCells?: string;
  
  // Alapértelmezett érték rejtett kérdéseknél (conditional_group_key használatakor)
  // Ha a trigger kérdésre "nem" a válasz, ez az érték kerül az Excel-be
  defaultIfHidden?: string;
  
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
    
    const charMap: Record<string, string> = {
      'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ö': 'o', 'ő': 'o', 'ú': 'u', 'ü': 'u', 'ű': 'u',
      'Á': 'a', 'É': 'e', 'Í': 'i', 'Ó': 'o', 'Ö': 'o', 'Ő': 'o', 'Ú': 'u', 'Ü': 'u', 'Ű': 'u',
      'ä': 'a', 'ë': 'e', 'ï': 'i', 'ß': 'ss',
      'Ä': 'a', 'Ë': 'e', 'Ï': 'i'
    };
    
    return text
      .split('')
      .map(char => charMap[char] || char)
      .join('')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_');
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

  private parseQuestionType(raw?: string): QuestionType {
    if (!raw) return 'text';
    const t = raw.toLowerCase().trim();

    if (['yes_no_na'].includes(t)) return 'yes_no_na';
    if (['yes_no', 'boolean', 'checkbox', 'igen_nem'].includes(t)) return 'checkbox';
    if (['true_false', 'radio', 'binary'].includes(t)) return 'radio';
    
    if (['measurement', 'mérés', 'numeric_with_unit'].includes(t)) return 'measurement';
    if (['calculated', 'computed', 'számított', 'berechnet'].includes(t)) return 'calculated';
    
    if (['number', 'numeric', 'integer', 'float', 'decimal'].includes(t)) return 'number';
    if (['textarea', 'memo', 'multiline', 'longtext'].includes(t)) return 'textarea';
    if (['select', 'dropdown', 'list', 'választó'].includes(t)) return 'select';
    if (['select_extended', 'selectextended', 'extended_select', 'multi_cell_select'].includes(t)) return 'select_extended';
    if (['phone', 'tel', 'telefon', 'telephone'].includes(t)) return 'phone';
    if (['email', 'e-mail', 'mail'].includes(t)) return 'email';
    if (['date', 'dátum', 'datum'].includes(t)) return 'date';
    if (['time', 'idő', 'zeit'].includes(t)) return 'time';
    if (['multi_select', 'multiselect', 'multiple'].includes(t)) return 'multi_select';
    if (['text', 'string', 'str', 'szöveg'].includes(t)) return 'text';
    
    return 'text';
  }

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
        if (Array.isArray(answer)) {
          return answer.join(', ');
        }
        return answer?.toString() || '';
        
      case 'date':
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
        codepage: 65001
      });

      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error('Excel file contains no sheets.');

      const worksheet = workbook.Sheets[sheetName];
      const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (data.length < 2) throw new Error('Excel file must contain header + at least one data row.');

      const headers = data[0].map((h: any) => String(h).trim());
      console.log(`📋 Headers found in Excel: [${headers.join(', ')}]`);

      // ===== JAVÍTOTT OSZLOPINDEX KERESÉS - KIS BETŰS KONZISZTENCIA =====
      const colIndices = {
        ID: this.findHeaderIndex(headers, 'id', 'question_id', 'questionId', 'kérdés_id', 'ID'),
        
        // TITLE mezők - kis betűs változatok prioritással
        TITLE: this.findHeaderIndex(headers, 'title', 'name', 'név', 'kérdés', 'Title'),
        TITLE_HU: this.findHeaderIndex(headers, 'titlehu', 'title_hu', 'titleHu', 'magyar_cím', 'Title HU', 'TitleHU'),
        TITLE_DE: this.findHeaderIndex(headers, 'titlede', 'title_de', 'titleDe', 'német_cím', 'Title DE', 'TitleDE'),
        TITLE_EN: this.findHeaderIndex(headers, 'titleen', 'title_en', 'titleEn', 'angol_cím', 'Title EN', 'TitleEN'),
        TITLE_FR: this.findHeaderIndex(headers, 'titlefr', 'title_fr', 'titleFr', 'francia_cím', 'Title FR', 'TitleFR'),
        TITLE_IT: this.findHeaderIndex(headers, 'titleit', 'title_it', 'titleIt', 'olasz_cím', 'Title IT', 'TitleIT'),
        
        TYPE: this.findHeaderIndex(headers, 'type', 'típus', 'tipus', 'Type'),
        
        // ===== OPTIONS (nyelvfüggetlen) =====
        OPTIONS: this.findHeaderIndex(headers, 'options', 'choices', 'választások', 'opciók', 'Options'),
        OPTION_CELLS: this.findHeaderIndex(headers, 'optioncells', 'option_cells', 'optionCells', 'Option Cells', 'OptionCells', 'cellák', 'cells'),
        
        MAX_LENGTH: this.findHeaderIndex(headers, 'maxlength', 'max_length', 'maxLength', 'Max Length', 'MaxLength'),
        REQUIRED: this.findHeaderIndex(headers, 'required', 'kötelező', 'kell', 'Required'),
        
        // PLACEHOLDER mezők
        PLACEHOLDER: this.findHeaderIndex(headers, 'placeholder', 'description', 'leírás', 'leiras', 'Placeholder'),
        PLACEHOLDER_HU: this.findHeaderIndex(headers, 'placeholderhu', 'placeholder_hu', 'placeholderHu', 'Placeholder HU', 'PlaceholderHU'),
        PLACEHOLDER_DE: this.findHeaderIndex(headers, 'placeholderde', 'placeholder_de', 'placeholderDe', 'Placeholder DE', 'PlaceholderDE'),
        PLACEHOLDER_EN: this.findHeaderIndex(headers, 'placeholderen', 'placeholder_en', 'placeholderEn', 'Placeholder EN', 'PlaceholderEN'),
        PLACEHOLDER_FR: this.findHeaderIndex(headers, 'placeholderfr', 'placeholder_fr', 'placeholderFr', 'Placeholder FR', 'PlaceholderFR'),
        PLACEHOLDER_IT: this.findHeaderIndex(headers, 'placeholderit', 'placeholder_it', 'placeholderIt', 'Placeholder IT', 'PlaceholderIT'),
        
        CELL_REF: this.findHeaderIndex(headers, 'cell_reference', 'cellReference', 'cellreference', 'cella', 'cel', 'Cell Reference', 'CellReference'),
        SHEET_NAME: this.findHeaderIndex(headers, 'sheet_name', 'sheetName', 'sheetname', 'munkalap', 'Sheet Name', 'SheetName'),
        MULTI_CELL: this.findHeaderIndex(headers, 'multi_cell', 'multiCell', 'multicell', 'több_cella', 'Multi Cell', 'MultiCell'),
        
        // GROUP NAME mezők
        GROUP_NAME: this.findHeaderIndex(headers, 'group_name', 'groupName', 'groupname', 'csoport', 'Group Name', 'GroupName'),
        GROUP_NAME_HU: this.findHeaderIndex(headers, 'groupnamehu', 'group_name_hu', 'groupNameHu', 'Group Name HU', 'GroupNameHU'),
        GROUP_NAME_DE: this.findHeaderIndex(headers, 'groupnamede', 'group_name_de', 'groupNameDe', 'Group Name DE', 'GroupNameDE'),
        GROUP_NAME_EN: this.findHeaderIndex(headers, 'groupnameen', 'group_name_en', 'groupNameEn', 'Group Name EN', 'GroupNameEN'),
        GROUP_NAME_FR: this.findHeaderIndex(headers, 'groupnamefr', 'group_name_fr', 'groupNameFr', 'Group Name FR', 'GroupNameFR'),
        GROUP_NAME_IT: this.findHeaderIndex(headers, 'groupnameit', 'group_name_it', 'groupNameIt', 'Group Name IT', 'GroupNameIT'),
        
        GROUP_KEY: this.findHeaderIndex(headers, 'groupKey', 'group_key', 'groupkey', 'Group Key', 'GroupKey'),
        GROUP_ORDER: this.findHeaderIndex(headers, 'group_order', 'groupOrder', 'grouporder', 'sorrend', 'Group Order', 'GroupOrder'),
        CONDITIONAL_GROUP_KEY: this.findHeaderIndex(headers, 'conditionalGroupKey', 'conditional_group_key', 'Conditional Group Key', 'ConditionalGroupKey'),
        DEFAULT_IF_HIDDEN: this.findHeaderIndex(headers, 'defaultIfHidden', 'default_if_hidden', 'Default If Hidden', 'DefaultIfHidden'),
        UNIT: this.findHeaderIndex(headers, 'unit', 'egység', 'mértékegység', 'Unit'),
        MIN_VALUE: this.findHeaderIndex(headers, 'min_value', 'minValue', 'min', 'Min Value', 'MinValue'),
        MAX_VALUE: this.findHeaderIndex(headers, 'max_value', 'maxValue', 'max', 'Max Value', 'MaxValue'),
        CALC_FORMULA: this.findHeaderIndex(headers, 'calculation_formula', 'calculationFormula', 'képlet', 'Calculation Formula', 'CalculationFormula'),
        CALC_INPUTS: this.findHeaderIndex(headers, 'calculation_inputs', 'calculationInputs', 'bemenetek', 'Calculation Inputs', 'CalculationInputs')
      };
      
      console.log('📊 Column indices found:', {
        TITLE_HU: colIndices.TITLE_HU,
        TITLE_DE: colIndices.TITLE_DE,
        PLACEHOLDER_HU: colIndices.PLACEHOLDER_HU,
        GROUP_NAME_HU: colIndices.GROUP_NAME_HU,
        TYPE: colIndices.TYPE,
        CELL_REF: colIndices.CELL_REF
      });

      const questions: ParsedQuestion[] = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || colIndices.ID === -1 || !row[colIndices.ID]) continue;

        const questionType = this.parseQuestionType(
          colIndices.TYPE !== -1 ? String(row[colIndices.TYPE]) : 'text'
        );

        // ===== JAVÍTOTT KÉRDÉS OBJEKTUM - TISZTA TÖBBNYELVŰ MODELL =====
        
        // Helper: Biztonságos string konverzió
        const safeString = (index: number): string | undefined => {
          if (index === -1 || !row[index]) return undefined;
          const trimmed = String(row[index]).trim();
          return trimmed.length > 0 ? trimmed : undefined;
        };
        
        const q: ParsedQuestion = {
          questionId: String(row[colIndices.ID]).trim(),
          
          // ===== TITLE - FALLBACK ÉS EXPLICIT NYELVEK =====
          title: safeString(colIndices.TITLE),           // NEM magyar!
          titleHu: safeString(colIndices.TITLE_HU),      // Magyar
          titleDe: safeString(colIndices.TITLE_DE),
          titleEn: safeString(colIndices.TITLE_EN),
          titleFr: safeString(colIndices.TITLE_FR),
          titleIt: safeString(colIndices.TITLE_IT),
          
          type: questionType,
          
          // ===== OPTIONS (nyelvfüggetlen technikai értékek) =====
          options: safeString(colIndices.OPTIONS),
          optionCells: safeString(colIndices.OPTION_CELLS), // select_extended típushoz
          
          maxLength: colIndices.MAX_LENGTH !== -1 && row[colIndices.MAX_LENGTH] 
            ? parseInt(String(row[colIndices.MAX_LENGTH])) 
            : undefined,
          
          required: colIndices.REQUIRED !== -1 
            ? this.parseBoolean(row[colIndices.REQUIRED]) 
            : false,
          
          // ===== PLACEHOLDER - FALLBACK ÉS EXPLICIT NYELVEK =====
          placeholder: safeString(colIndices.PLACEHOLDER),        // NEM magyar!
          placeholderHu: safeString(colIndices.PLACEHOLDER_HU),   // Magyar
          placeholderDe: safeString(colIndices.PLACEHOLDER_DE),
          placeholderEn: safeString(colIndices.PLACEHOLDER_EN),
          placeholderFr: safeString(colIndices.PLACEHOLDER_FR),
          placeholderIt: safeString(colIndices.PLACEHOLDER_IT),
          
          cellReference: safeString(colIndices.CELL_REF),
          sheetName: safeString(colIndices.SHEET_NAME) || sheetName,
          multiCell: colIndices.MULTI_CELL !== -1 
            ? this.parseBoolean(row[colIndices.MULTI_CELL]) 
            : false,
          
          // ===== GROUP NAME - FALLBACK ÉS EXPLICIT NYELVEK =====
          groupName: safeString(colIndices.GROUP_NAME),           // NEM magyar!
          groupNameHu: safeString(colIndices.GROUP_NAME_HU),      // Magyar
          groupNameDe: safeString(colIndices.GROUP_NAME_DE),
          groupNameEn: safeString(colIndices.GROUP_NAME_EN),
          groupNameFr: safeString(colIndices.GROUP_NAME_FR),
          groupNameIt: safeString(colIndices.GROUP_NAME_IT),
          
          // ===== GROUP KEY - AUTO-GENERATE HA NINCS =====
          groupKey: (() => {
            const explicitKey = safeString(colIndices.GROUP_KEY);
            if (explicitKey) return explicitKey;
            
            // Fallback: első elérhető groupName-ből generál slugot
            const firstGroupName = 
              safeString(colIndices.GROUP_NAME_HU) ||
              safeString(colIndices.GROUP_NAME_EN) ||
              safeString(colIndices.GROUP_NAME_DE) ||
              safeString(colIndices.GROUP_NAME);
            
            return firstGroupName ? this.slugify(firstGroupName) : 'default';
          })(),
          
          groupOrder: colIndices.GROUP_ORDER !== -1 && row[colIndices.GROUP_ORDER] 
            ? parseInt(String(row[colIndices.GROUP_ORDER])) 
            : 0,
          
          conditionalGroupKey: safeString(colIndices.CONDITIONAL_GROUP_KEY),
          defaultIfHidden: safeString(colIndices.DEFAULT_IF_HIDDEN),
          
          unit: safeString(colIndices.UNIT),
          minValue: colIndices.MIN_VALUE !== -1 && row[colIndices.MIN_VALUE] 
            ? parseFloat(String(row[colIndices.MIN_VALUE])) 
            : undefined,
          maxValue: colIndices.MAX_VALUE !== -1 && row[colIndices.MAX_VALUE] 
            ? parseFloat(String(row[colIndices.MAX_VALUE])) 
            : undefined,
          calculationFormula: safeString(colIndices.CALC_FORMULA),
          calculationInputs: safeString(colIndices.CALC_INPUTS),
        };
        
        // Debug információ
        if (q.type === 'select' || q.type === 'multi_select') {
          console.log(`📝 Question ${q.questionId} (${q.type}) has options: ${q.options || 'N/A'}`);
        }
        
        questions.push(q);
      }

      console.log(`✅ Successfully parsed ${questions.length} questions.`);
      
      // Statisztikák
      const stats = {
        total: questions.length,
        withCellRef: questions.filter(q => q.cellReference).length,
        withOptions: questions.filter(q => q.options).length,
        withTitleHu: questions.filter(q => q.titleHu).length,
        withGroupNameHu: questions.filter(q => q.groupNameHu).length,
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
        codepage: 65001
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
        codepage: 65001
      });

      questions.forEach(question => {
        const answer = answers[question.questionId];
        
        // ===== SELECT_EXTENDED SPECIÁLIS KEZELÉS =====
        // Minden opciónak saját cellája van, "X" a kiválasztottnak, "-" a többinek
        if (question.type === 'select_extended' && question.options && question.optionCells) {
          const optionsArr = question.options.split(',').map(o => o.trim());
          const cellsArr = question.optionCells.split(',').map(c => c.trim());
          
          if (optionsArr.length !== cellsArr.length) {
            console.warn(`⚠️ select_extended mismatch for "${question.questionId}": options(${optionsArr.length}) != cells(${cellsArr.length})`);
            return;
          }
          
          const defaultSheetName = question.sheetName || workbook.SheetNames[0];
          
          // Minden cellát kitöltünk
          cellsArr.forEach((cellRef, index) => {
            const [sheetName, actualCellRef] = cellRef.includes('!')
              ? cellRef.split('!')
              : [defaultSheetName, cellRef];
            
            if (sheetName && workbook.Sheets[sheetName]) {
              const worksheet = workbook.Sheets[sheetName];
              // Ha ez a kiválasztott opció, "X"-et írunk, különben "-"-t
              const value = (answer === optionsArr[index]) ? 'X' : '-';
              worksheet[actualCellRef] = { v: value, t: 's' };
              console.log(`🖋️ select_extended ${sheetName}!${actualCellRef} = "${value}" (option: ${optionsArr[index]})`);
            }
          });
          return; // Megvan, tovább a következő kérdésre
        }
        
        // ===== NORMÁL KÉRDÉSEK (eredeti logika) =====
        if (!question.cellReference || answer === undefined || answer === null) return;

        const [sheetName, cellRef] = question.cellReference.includes('!')
          ? question.cellReference.split('!')
          : [question.sheetName || workbook.SheetNames[0], question.cellReference];

        if (sheetName && workbook.Sheets[sheetName]) {
          const worksheet = workbook.Sheets[sheetName];
          const value = this.formatAnswerForExcel(answer, question.type);
          
          let cellType: string = 's';
          if (typeof value === 'number') cellType = 'n';
          if (value instanceof Date) cellType = 'd';
          
          worksheet[cellRef] = { 
            v: value, 
            t: cellType,
            ...(cellType === 'd' && { z: 'yyyy-mm-dd' })
          };

          console.log(`🖋️ Filled ${sheetName}!${cellRef} for "${question.questionId}" (${question.type}) = ${value}`);
        }
      });

      return XLSX.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx',
        cellDates: true
      });
    } catch (error) {
      console.error('❌ Error populating Excel template:', error);
      throw new Error('Failed to populate Excel template');
    }
  }
}

export const excelParserService = new ExcelParserService();