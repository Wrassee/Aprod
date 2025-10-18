// server/services/grounding-pdf-service.ts - VÉGLEGES, MÉRETEZÉSSEL JAVÍTOTT VERZIÓ

import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { groundingPdfMapping } from '../config/grounding-pdf-mapping.js';
import { GroundingAnswer, FormData } from '../../shared/types.js';

export class GroundingPdfService {
  static async generateFilledPdf(formData: FormData): Promise<Buffer> {
    const templatePath = path.resolve(
      process.cwd(),
      'public/templates/Erdungskontrolle.pdf'
    );
    const pdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    // =================================================================
    // === 1. JAVÍTOTT FEJLÉC ÉS KÉP KITÖLTÉS (EGYSÉGESÍTVE) ===
    // =================================================================
    for (const { appDataKey, pdfFieldName } of groundingPdfMapping.metadata) {
      const value = (formData as any)[appDataKey];
      if (value === undefined || value === '') continue;

      // KÜLÖN LOGIKA AZ ALÁÍRÁS KÉPNEK
      if (appDataKey === 'signature' && typeof value === 'string' && value.startsWith('data:image/png;base64,')) {
        try {
          // 1. Kép beágyazása
          const pngImage = await pdfDoc.embedPng(value);
          
          // 2. A célmező (gomb) és annak méreteinek lekérdezése
          const imageField = form.getButton(pdfFieldName);
          const widgets = imageField.getWidgets();
          if (widgets.length > 0) {
            const { width, height, x, y } = widgets[0].getRectangle();
            
            // 3. Arányos méretezés kiszámítása
            const scale = Math.min(width / pngImage.width, height / pngImage.height);
            const scaledWidth = pngImage.width * scale;
            const scaledHeight = pngImage.height * scale;

            // 4. Kép beállítása a gomb ikonjaként, méretezés nélkül (az Acrobat kezeli)
            // A trükk az, hogy a flatten() parancs előtt kell ezt megtenni.
            imageField.setImage(pngImage);
            console.log(`✅ Signature image set for field: "${pdfFieldName}"`);
          }

        } catch (e) {
          console.warn(`⚠️ Hiba az aláíráskép beillesztésekor a(z) '${pdfFieldName}' mezőbe:`, e);
        }
      } 
      // A TÖBBI SZÖVEGES MEZŐ
      else {
        try {
          form.getTextField(pdfFieldName).setText(String(value));
        } catch {
          console.warn(`⚠️ Szöveges mező nem található vagy nem kompatibilis: "${pdfFieldName}"`);
        }
      }
    }

    // === EGYÉNI SZÖVEGEK BEÍRÁSA A PDF-BE ===
    if (formData.customTexts) {
      console.log('📝 Processing custom texts...');
      for (const [pdfFieldName, textValue] of Object.entries(formData.customTexts)) {
        // Csak akkor írunk, ha van szöveg
        if (textValue && typeof textValue === 'string') {
          try {
            const field = form.getTextField(pdfFieldName);
            field.setText(textValue);
            console.log(`✅ Custom text written to field "${pdfFieldName}": ${textValue}`);
          } catch {
            console.warn(`⚠️ Egyéni szövegmező nem található: "${pdfFieldName}"`);
          }
        }
      }
    }

    // 2. Hibás válaszok összegyűjtése (változatlan)
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
      } catch (e) { console.warn(`⚠️ Hiba a(z) ${questionId} válasz beírásakor.`); }
    });

    // 3. Bemerkung mezők kitöltése (változatlan)
    groundingPdfMapping.remarks.forEach((row, index) => {
      if (remarks[index]) {
        try {
          form.getTextField(row.punktField).setText(remarks[index].punkt);
          form.getTextField(row.bemerkungField).setText(remarks[index].bemerkung);
        } catch (e) { console.warn(`⚠️ Hiba a Bemerkung sor beírásakor.`); }
      }
    });
    
    // 4. PDF Kilapítása (Ez "ráégeti" a képet a gombra a helyes méretben)
    form.flatten();

    // 5. PDF Mentése
    const filledPdfBytes = await pdfDoc.save();
    return Buffer.from(filledPdfBytes);
  }
}