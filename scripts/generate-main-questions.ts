// scripts/generate-main-questions.ts
import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Ez az interfész a 'questions' munkalap oszlopait írja le
interface ExcelRow {
  ID: string | number;
  titleHu: string;
  titleDe: string;
  Type: string;
  cellReference?: string;
  Unit?: string;
  groupName?: string;
  groupNameDe?: string;
  groupOrder?: number;
  required?: string;
  placeholder?: string;
  conditional_group_key?: string; // A fontos kulcs!
  // ... ide jöhet a többi oszlop, ha van
}

// A Question típus a frontenden használt formátum
interface Question {
  id: string;
  questionId: string;
  title: string;
  type: string;
  groupName: string;
  conditional_group_key?: string;
  // ... és a többi mező
  [key: string]: any; 
}


function generateJsonFromExcel() {
  console.log('🔄 Starting Excel to JSON conversion for MAIN questions...');

  try {
    const excelPath = path.resolve(process.cwd(), 'public/templates/Abnahme FRAGEN.xlsx');
    const workbook = XLSX.readFile(excelPath);
    // A 'questions' munkalapra van szükségünk!
    const worksheetName = 'questions'; 
    const worksheet = workbook.Sheets[worksheetName];

    if (!worksheet) {
      throw new Error(`Worksheet '${worksheetName}' not found in Excel file.`);
    }

    const rows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

    const questionsHu: Question[] = [];
    const questionsDe: Question[] = [];

    rows.forEach(row => {
      const commonData = {
        id: String(row.ID),
        questionId: String(row.ID),
        type: row.Type,
        required: String(row.required).toUpperCase() === 'TRUE',
        placeholder: row.placeholder || '',
        unit: row.Unit || '',
        cellReference: row.cellReference || '',
        groupOrder: row.groupOrder || 0,
        // Itt olvassuk be a conditional_group_key értékét!
        conditional_group_key: row.conditional_group_key || '',
      };
      
      questionsHu.push({
        ...commonData,
        title: row.titleHu,
        groupName: row.groupName || '',
      });

      questionsDe.push({
        ...commonData,
        title: row.titleDe,
        groupName: row.groupNameDe || row.groupName || '',
      });
    });

    const outputDir = path.resolve(process.cwd(), 'public');
    
    // Ellenőrizzük, hogy a 'public' mappa létezik-e
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(outputDir, 'questions_hu.json'),
      JSON.stringify(questionsHu, null, 2)
    );
    console.log('✅ Successfully created public/questions_hu.json');

    fs.writeFileSync(
      path.join(outputDir, 'questions_de.json'),
      JSON.stringify(questionsDe, null, 2)
    );
    console.log('✅ Successfully created public/questions_de.json');

    console.log('🎉 Main question conversion complete!');

  } catch (error) {
    console.error('❌ Error during Excel to JSON conversion:', error);
  }
}

generateJsonFromExcel();