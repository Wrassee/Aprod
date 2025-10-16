// server/services/grounding-pdf-service.ts - VÉGLEGES, ÉKEZETKEZELŐ VERZIÓ

import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { groundingPdfMapping } from '../config/grounding-pdf-mapping.js';
import { GroundingAnswer, FormData } from '../../shared/types.js';

export class GroundingPdfService {
  static async generateFilledPdf(formData: FormData): Promise<Buffer> {
    console.log('--- FUT A VÉGLEGES, ÉKEZETKEZELŐ SERVICE KÓD! v4 ---');
    
    // Sablon PDF beolvasása
    const templatePath = path.resolve(process.cwd(), 'public/templates/Erdungskontrolle.pdf');
    const pdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // ✅ 1. BETŰTÍPUS BEOLVASÁSA ÉS BEÁGYAZÁSA
    const fontPath = path.resolve(process.cwd(), 'public/fonts/Roboto-Regular.ttf');
    const fontBytes = fs.readFileSync(fontPath);
    const robotoFont = await pdfDoc.embedFont(fontBytes);

    const form = pdfDoc.getForm();

    // 2. Fejléc és kép mezők kitöltése
    for (const { appDataKey, pdfFieldName } of groundingPdfMapping.metadata) {
      const value = (formData as any)[appDataKey];
      if (value === undefined || value === '') continue;

      if (appDataKey === 'signature' && typeof value === 'string' && value.startsWith('data:image/png;base64,')) {
        try {
          const pngImage = await pdfDoc.embedPng(value);
          form.getButton(pdfFieldName).setImage(pngImage);
          console.log(`✅ Aláírás kép beillesztve a(z) "${pdfFieldName}" mezőbe.`);
        } catch (e) { console.warn(`⚠️ Hiba az aláíráskép beillesztésekor:`, e); }
      } else {
        try {
          // ✅ HASZNÁLJUK A SAJÁT BETŰTÍPUSUNKAT!
          form.getTextField(pdfFieldName).setText(String(value), { font: robotoFont });
        } catch { console.warn(`⚠️ Szöveges mező nem található: "${pdfFieldName}"`); }
      }
    }

    // 3. Válaszok feldolgozása
    const remarks: { punkt: string; bemerkung: string }[] = [];
    groundingPdfMapping.answers.forEach(({ questionId, okFieldName, notOkFieldName }) => {
      const answer = formData.groundingCheckAnswers?.[questionId];
      if (!answer) return;
      try {
        if (answer === 'ok') form.getTextField(okFieldName).setText('X', { font: robotoFont });
        else if (answer === 'not_ok') {
          form.getTextField(notOkFieldName).setText('X', { font: robotoFont });
          const punkt = okFieldName.replace('OK', '');
          remarks.push({ punkt, bemerkung: `Hiba a ${punkt} pontnál.` });
        } else if (answer === 'not_applicable') {
          form.getTextField(okFieldName).setText('-', { font: robotoFont });
        }
      } catch (e) { console.warn(`⚠️ Hiba a(z) ${questionId} válasz beírásakor.`)}
    });

    // 4. Bemerkung mezők kitöltése
    groundingPdfMapping.remarks.forEach((row, index) => {
      if (remarks[index]) {
        try {
          // ✅ HASZNÁLJUK A SAJÁT BETŰTÍPUSUNKAT!
          form.getTextField(row.punktField).setText(remarks[index].punkt, { font: robotoFont });
          form.getTextField(row.bemerkungField).setText(remarks[index].bemerkung, { font: robotoFont });
        } catch (e) { console.warn(`⚠️ Hiba a Bemerkung sor beírásakor.`)}
      }
    });
    
    // 5. PDF Kilapítása
    form.flatten();

    // 6. PDF Mentése
    const filledPdfBytes = await pdfDoc.save();
    return Buffer.from(filledPdfBytes);
  }
}