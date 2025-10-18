// server/services/grounding-pdf-service.ts - VÉGLEGES, JAVÍTOTT VERZIÓ

import { PDFDocument, PDFTextField } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';
import { groundingPdfMapping } from '../config/grounding-pdf-mapping.js';
import { GroundingAnswer, FormData } from '../../shared/types.js';

export class GroundingPdfService {
  static async generateFilledPdf(formData: FormData): Promise<Buffer> {
    const templatePath = path.resolve(process.cwd(), 'public/templates/Erdungskontrolle.pdf');
    const pdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    pdfDoc.registerFontkit(fontkit);

    const fontPath = path.resolve(process.cwd(), 'public/fonts/Roboto-Regular.ttf');
    const fontBytes = fs.readFileSync(fontPath);
    const robotoFont = await pdfDoc.embedFont(fontBytes);

    const form = pdfDoc.getForm();

    // A központi betűtípus-beállítást (forEach ciklus) kivettük, mert megbízhatatlan.

    // 1. Fejléc és kép mezők kitöltése
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
          const field = form.getTextField(pdfFieldName);
          field.setText(String(value));
          // ✅ EZ A JAVÍTÁS: Azonnal frissítjük a kinézetet a helyes betűtípussal
          field.updateAppearances(robotoFont); 
        } catch { console.warn(`⚠️ Szöveges mező nem található: "${pdfFieldName}"`); }
      }
    }

    // 2. Egyéni szövegek beírása
    if (formData.customGroundingTexts) {
      for (const [pdfFieldName, textValue] of Object.entries(formData.customGroundingTexts)) {
        if (textValue && typeof textValue === 'string') {
          try {
            const field = form.getTextField(pdfFieldName);
            field.setText(textValue);
            // ✅ EZ A JAVÍTÁS ITT IS: Azonnal frissítjük a kinézetet
            field.updateAppearances(robotoFont);
          } catch { console.warn(`⚠️ Egyéni szövegmező nem található: "${pdfFieldName}"`); }
        }
      }
    }
    
    // 3. Válaszok feldolgozása
    const remarks: { punkt: string; bemerkung: string }[] = [];
    if (formData.groundingCheckAnswers) {
      groundingPdfMapping.answers.forEach(({ questionId, okFieldName, notOkFieldName }) => {
        const answer = formData.groundingCheckAnswers![questionId];
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
    }

    // 4. Bemerkung mezők kitöltése
    groundingPdfMapping.remarks.forEach((row, index) => {
      if (remarks[index]) {
        try {
          const punktField = form.getTextField(row.punktField);
          punktField.setText(remarks[index].punkt);
          punktField.updateAppearances(robotoFont); // ✅ JAVÍTÁS ITT IS

          const bemerkungField = form.getTextField(row.bemerkungField);
          bemerkungField.setText(remarks[index].bemerkung);
          bemerkungField.updateAppearances(robotoFont); // ✅ JAVÍTÁS ITT IS
        } catch (e) { console.warn(`⚠️ Hiba a Bemerkung sor beírásakor.`)}
      }
    });
    // =========================================================================
    // === EZ AZ ÚJ BLOKK: TÚL SOK HIBA ESETÉN FELÜLÍRJA A 2. SORT ===
    // =========================================================================
    if (remarks.length > 2) {
      try {
        const message = "A további hibákat keresd a közös hibalistában";

    // Töröljük a 2. sor pontját
    const punktRow2Field = form.getTextField('PunktRow2');
    punktRow2Field.setText(''); // ✅ JAVÍTVA
    punktRow2Field.updateAppearances(robotoFont); // ✅ JAVÍTVA

    // Beírjuk az üzenetet a 2. sor megjegyzésébe
    const bemerkungRow2Field = form.getTextField('Bemerkung Row2');
    bemerkungRow2Field.setText(message);
    bemerkungRow2Field.updateAppearances(robotoFont);

    console.log('📝 Too many errors, added overflow message to Bemerkung Row2.');
  } catch (e) {
    console.warn(`⚠️ Hiba a "további hibák" üzenet beírásakor:`, e);
  }
}
    
    form.flatten();
    const filledPdfBytes = await pdfDoc.save();
    return Buffer.from(filledPdfBytes);
  }
}