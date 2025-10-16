// server/services/grounding-pdf-service.ts - VÉGLEGES, FONTKIT REGISZTRÁCIÓVAL

import { PDFDocument, PDFTextField } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit'; // ✅ 1. FONTKIT IMPORTÁLÁSA
import fs from 'fs';
import path from 'path';
import { groundingPdfMapping } from '../config/grounding-pdf-mapping.js';
import { GroundingAnswer, FormData } from '../../shared/types.js';

export class GroundingPdfService {
  static async generateFilledPdf(formData: FormData): Promise<Buffer> {
    const templatePath = path.resolve(process.cwd(), 'public/templates/Erdungskontrolle.pdf');
    const pdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // ✅ 2. FONTKIT REGISZTRÁLÁSA A DOKUMENTUMHOZ
    pdfDoc.registerFontkit(fontkit);

    // ✅ 3. BETŰTÍPUS BEOLVASÁSA ÉS BEÁGYAZÁSA
    const fontPath = path.resolve(process.cwd(), 'public/fonts/Roboto-Regular.ttf');
    const fontBytes = fs.readFileSync(fontPath);
    const robotoFont = await pdfDoc.embedFont(fontBytes);

    const form = pdfDoc.getForm();

    // Az összes szöveges mező betűtípusának beállítása
    const fields = form.getFields();
    fields.forEach(field => {
      if (field instanceof PDFTextField) {
        field.defaultUpdateAppearances(robotoFont);
      }
    });

    // Fejléc és kép mezők kitöltése
    for (const { appDataKey, pdfFieldName } of groundingPdfMapping.metadata) {
      const value = (formData as any)[appDataKey];
      if (value === undefined || value === '') continue;

      if (appDataKey === 'signature' && typeof value === 'string' && value.startsWith('data:image/png;base64,')) {
        try {
          const pngImage = await pdfDoc.embedPng(value);
          form.getButton(pdfFieldName).setImage(pngImage); 
        } catch (e) { console.warn(`⚠️ Hiba az aláíráskép beillesztésekor:`, e); }
      } else {
        try {
          form.getTextField(pdfFieldName).setText(String(value));
        } catch { console.warn(`⚠️ Szöveges mező nem található: "${pdfFieldName}"`); }
      }
    }

    // 4. Válaszok feldolgozása
    const remarks: { punkt: string; bemerkung: string }[] = [];
    groundingPdfMapping.answers.forEach(({ questionId, okFieldName, notOkFieldName }) => {
      const answer = formData.groundingCheckAnswers?.[questionId];
      if (!answer) return;
      try {
        if (answer === 'ok') form.getTextField(okFieldName).setText('X');
        else if (answer === 'not_ok') {
          form.getTextField(notOkFieldName).setText('X');
          const punkt = okFieldName.replace('OK', '');
          remarks.push({ punkt, bemerkung: `Hiba a ${punkt} pontnál.` });
        } else if (answer === 'not_applicable') {
          form.getTextField(okFieldName).setText('-');
        }
      } catch (e) { console.warn(`⚠️ Hiba a(z) ${questionId} válasz beírásakor.`)}
    });

    // 5. Bemerkung mezők kitöltése
    groundingPdfMapping.remarks.forEach((row, index) => {
      if (remarks[index]) {
        try {
          form.getTextField(row.punktField).setText(remarks[index].punkt);
          form.getTextField(row.bemerkungField).setText(remarks[index].bemerkung);
        } catch (e) { console.warn(`⚠️ Hiba a Bemerkung sor beírásakor.`)}
      }
    });
    
    // 6. PDF Kilapítása
    form.flatten();

    // 7. PDF Mentése
    const filledPdfBytes = await pdfDoc.save();
    return Buffer.from(filledPdfBytes);
  }
}