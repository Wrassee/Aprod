// server/services/grounding-pdf-service.ts - VÉGLEGES, ROBUSZTUS VERZIÓ

import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { groundingPdfMapping } from '../config/grounding-pdf-mapping.js';
import { GroundingAnswer, FormData } from '../../shared/types.js';

export class GroundingPdfService {
  static async generateFilledPdf(formData: FormData): Promise<Buffer> {
    console.log('--- FUT A VÉGLEGES, ROBUSZTUS SERVICE KÓD! v3 ---');
    
    const templatePath = path.resolve(
      process.cwd(),
      'public/templates/Erdungskontrolle.pdf'
    );
    const pdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    // 1. Fejléc és kép mezők kitöltése
    for (const { appDataKey, pdfFieldName } of groundingPdfMapping.metadata) {
      const value = (formData as any)[appDataKey];
      if (value === undefined || value === '') continue;

      if (appDataKey === 'signature' && typeof value === 'string' && value.startsWith('data:image/png;base64,')) {
        try {
          const pngImage = await pdfDoc.embedPng(value);
          // A getButton() paranccsal vesszük a képmezőt és beállítjuk a képét (ikonját)
          form.getButton(pdfFieldName).setImage(pngImage); 
          console.log(`✅ Aláírás kép beillesztve a(z) "${pdfFieldName}" mezőbe.`);
        } catch (e) {
          console.warn(`⚠️ Hiba az aláíráskép beillesztésekor a(z) '${pdfFieldName}' mezőbe:`, e);
        }
      } 
      else {
        try {
          form.getTextField(pdfFieldName).setText(String(value));
        } catch {
          console.warn(`⚠️ Szöveges mező nem található vagy nem kompatibilis: "${pdfFieldName}"`);
        }
      }
    }

    // 2. Válaszok feldolgozása (változatlan)
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

    // 3. Bemerkung mezők kitöltése (változatlan)
    groundingPdfMapping.remarks.forEach((row, index) => {
      if (remarks[index]) {
        try {
          form.getTextField(row.punktField).setText(remarks[index].punkt);
          form.getTextField(row.bemerkungField).setText(remarks[index].bemerkung);
        } catch (e) { console.warn(`⚠️ Hiba a Bemerkung sor beírásakor.`)}
      }
    });
    
    // 4. PDF Kilapítása
    form.flatten();

    // 5. PDF Mentése
    const filledPdfBytes = await pdfDoc.save();
    return Buffer.from(filledPdfBytes);
  }
}