// server/services/grounding-pdf-service.ts – VÉGLEGES, HELYES BETŰBEÁGYAZÁS (v9)

import { PDFDocument, PDFTextField, PDFButton } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';
import { groundingPdfMapping } from '../config/grounding-pdf-mapping.js';
import { GroundingAnswer, FormData } from '../../shared/types.js';

export class GroundingPdfService {
  static async generateFilledPdf(formData: FormData): Promise<Buffer> {
    console.log('--- FUT A VÉGLEGES, HELYES ÉKEZETKEZELŐ KÓD! v9 ---');

    // 1️⃣ PDF sablon betöltése
    const templatePath = path.resolve(process.cwd(), 'public/templates/Erdungskontrolle.pdf');
    const pdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // 2️⃣ Fontkit regisztrálása
    pdfDoc.registerFontkit(fontkit);

    // 3️⃣ Betűtípusok beágyazása
    const regularFontPath = path.resolve(process.cwd(), 'public/fonts/Roboto-Regular.ttf');
    const boldFontPath = path.resolve(process.cwd(), 'public/fonts/Roboto-Bold.ttf');

    const regularFontBytes = fs.readFileSync(regularFontPath);
    const boldFontBytes = fs.readFileSync(boldFontPath);

    const robotoFont = await pdfDoc.embedFont(regularFontBytes);
    const robotoBold = await pdfDoc.embedFont(boldFontBytes);

    const form = pdfDoc.getForm();

    // 4️⃣ Alapadatok kitöltése
    for (const { appDataKey, pdfFieldName } of groundingPdfMapping.metadata) {
      const value = (formData as any)[appDataKey];
      if (!value) continue;

      if (appDataKey === 'signature' && typeof value === 'string' && value.startsWith('data:image/png;base64,')) {
        try {
          const pngImage = await pdfDoc.embedPng(value);
          const imageField = form.getField(pdfFieldName);
          if (imageField instanceof PDFButton) {
            (imageField as any).setImage(pngImage);
            console.log(`✅ Signature image set for field: "${pdfFieldName}"`);
          }
        } catch (e) {
          console.warn(`⚠️ Hiba az aláíráskép beillesztésekor a(z) '${pdfFieldName}' mezőbe:`, e);
        }
      } else {
        try {
          const field = form.getTextField(pdfFieldName);
          field.setText(String(value));
          field.setFont(robotoFont);
          field.setFontSize(10);
        } catch {
          console.warn(`⚠️ Szöveges mező nem található vagy nem kompatibilis: "${pdfFieldName}"`);
        }
      }
    }

    // 5️⃣ Egyéni szövegek beírása
    if (formData.customGroundingTexts) {
      console.log('📝 Processing custom texts...');
      for (const [pdfFieldName, textValue] of Object.entries(formData.customGroundingTexts)) {
        if (textValue && typeof textValue === 'string') {
          try {
            const field = form.getTextField(pdfFieldName);
            field.setText(textValue);
            field.setFont(robotoFont);
            field.setFontSize(10);
            console.log(`✅ Custom text written to field "${pdfFieldName}"`);
          } catch {
            console.warn(`⚠️ Egyéni szövegmező nem található: "${pdfFieldName}"`);
          }
        }
      }
    }

    // 6️⃣ Földelési kérdések (OK / nicht OK / -) – HELYES VERZIÓ
    const remarks: { punkt: string; bemerkung: string }[] = [];
groundingPdfMapping.answers.forEach(({ questionId, okFieldName, notOkFieldName }) => {
    const answer = formData.groundingCheckAnswers?.[questionId];
    if (!answer) return;

    try {
        if (answer === 'ok') {
            const field = form.getTextField(okFieldName);
            field.setText('X');
            // ✅ JAVÍTÁS: Csak a betűtípust adjuk át, méret nélkül
            field.updateAppearances(robotoBold);
        } else if (answer === 'not_ok') {
            const field = form.getTextField(notOkFieldName);
            field.setText('X');
            // ✅ JAVÍTÁS: Csak a betűtípust adjuk át, méret nélkül
            field.updateAppearances(robotoBold);

            const punkt = okFieldName.replace('OK', '');
            remarks.push({ punkt, bemerkung: `Hiba a ${punkt} pontnál.` });
        } else if (answer === 'not_applicable') {
            const field = form.getTextField(okFieldName);
            field.setText('-');
            // ✅ JAVÍTÁS: Csak a betűtípust adjuk át, méret nélkül
            field.updateAppearances(robotoBold);
        }
    } catch (e) {
        console.warn(`⚠️ Hiba a(z) ${questionId} válasz beírásakor:`, e);
    }
});

    // 7️⃣ Bemerkung mezők kitöltése – HELYES VERZIÓ
    if (remarks.length >= 1) {
    try {
        const row1 = groundingPdfMapping.remarks[0];
        const punktField1 = form.getTextField(row1.punktField);
        const bemerkungField1 = form.getTextField(row1.bemerkungField);

        punktField1.setText(remarks[0].punkt);
        bemerkungField1.setText(remarks[0].bemerkung);

        // ✅ JAVÍTÁS: Csak a betűtípust adjuk át, méret nélkül
        punktField1.updateAppearances(robotoBold);
        bemerkungField1.updateAppearances(robotoBold);
    } catch (e) {
        console.warn(`⚠️ Hiba a Bemerkung 1. sor beírásakor:`, e);
    }
}

if (remarks.length >= 2) {
    try {
        const row2 = groundingPdfMapping.remarks[1];
        const punktField2 = form.getTextField(row2.punktField);
        const bemerkungField2 = form.getTextField(row2.bemerkungField);

        if (remarks.length > 2) {
            bemerkungField2.setText('A további hibákat keresd a közös hibalistában');
            punktField2.setText('');
        } else {
            punktField2.setText(remarks[1].punkt);
            bemerkungField2.setText(remarks[1].bemerkung);
        }

        // ✅ JAVÍTÁS: Csak a betűtípust adjuk át, méret nélkül
        punktField2.updateAppearances(robotoBold);
        bemerkungField2.updateAppearances(robotoBold);
    } catch (e) {
        console.warn(`⚠️ Hiba a Bemerkung 2. sor beírásakor:`, e);
    }
}

    // 8️⃣ PDF kilapítása és mentés
    form.flatten();
    const filledPdfBytes = await pdfDoc.save();
    return Buffer.from(filledPdfBytes);
  }
}
