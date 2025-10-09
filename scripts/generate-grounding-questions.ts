// scripts/generate-grounding-questions.ts

import XLSX from 'xlsx';

import * as fs from 'fs';

import * as path from 'path';



// Interfészek a típusbiztossághoz

interface ExcelRow {

  group_id: string;

  group_title_hu: string;

  group_title_de: string;

  question_id: string;

  question_text_hu: string;

  question_text_de: string;

}



interface GroundingQuestion {

  id: string;

  text: string;

}



interface GroundingGroup {

  id: string;

  title: string;

  questions: GroundingQuestion[];

}



// A script fő logikája

function generateJsonFromExcel() {

  console.log('🔄 Starting Excel to JSON conversion for grounding questions...');



  try {

    // 1. Excel fájl és munkalap beolvasása

    const excelPath = path.resolve(process.cwd(), 'public/templates/Abnahme FRAGEN.xlsx');

    const workbook = XLSX.readFile(excelPath);

    const worksheetName = 'Erdungskontrolle_Fragen';

    const worksheet = workbook.Sheets[worksheetName];



    if (!worksheet) {

      throw new Error(`Worksheet '${worksheetName}' not found in the Excel file.`);

    }



    const rows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);



    // 2. Adatok csoportosítása és feldolgozása

    const groupsHu = new Map<string, GroundingGroup>();

    const groupsDe = new Map<string, GroundingGroup>();



    rows.forEach(row => {

      // Magyar adatok feldolgozása

      if (!groupsHu.has(row.group_id)) {

        groupsHu.set(row.group_id, { id: row.group_id, title: row.group_title_hu, questions: [] });

      }

      groupsHu.get(row.group_id)!.questions.push({ id: row.question_id, text: row.question_text_hu });



      // Német adatok feldolgozása

      if (!groupsDe.has(row.group_id)) {

        groupsDe.set(row.group_id, { id: row.group_id, title: row.group_title_de, questions: [] });

      }

      groupsDe.get(row.group_id)!.questions.push({ id: row.question_id, text: row.question_text_de });

    });



    // 3. JSON fájlok létrehozása

    const outputDir = path.resolve(process.cwd(), 'public');

    const huData = { groups: Array.from(groupsHu.values()) };

    const deData = { groups: Array.from(groupsDe.values()) };



    fs.writeFileSync(

      path.join(outputDir, 'questions_grounding_hu.json'),

      JSON.stringify(huData, null, 2)

    );

    console.log('✅ Successfully created questions_grounding_hu.json');



    fs.writeFileSync(

      path.join(outputDir, 'questions_grounding_de.json'),

      JSON.stringify(deData, null, 2)

    );

    console.log('✅ Successfully created questions_grounding_de.json');



    console.log('🎉 Conversion complete!');



  } catch (error) {

    console.error('❌ Error during Excel to JSON conversion:', error);

  }

}



// Futtassuk a függvényt

generateJsonFromExcel();