// server/services/grounding-pdf-service.ts - VÉGLEGES, JAVÍTOTT ÉKEZETKEZELÉS

import { PDFDocument, PDFTextField, PDFButton } from 'pdf-lib'; // ✅ PDFTextField és PDFButton importálása
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';
import { groundingPdfMapping } from '../config/grounding-pdf-mapping.js';
import { GroundingAnswer, FormData } from '../../shared/types.js';

export class GroundingPdfService {
  static async generateFilledPdf(formData: FormData): Promise<Buffer> {
    console.log('--- FUT A VÉGLEGES, HELYES ÉKEZETKEZELŐ KÓD! v6 ---');
    
    const templatePath = path.resolve(process.cwd(), 'public/templates/Erdungskontrolle.pdf');
    const pdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // ✅ 1. FONTKIT REGISZTRÁLÁSA A DOKUMENTUMHOZ
    pdfDoc.registerFontkit(fontkit);

    // ✅ 2. BETŰTÍPUS BEOLVASÁSA ÉS BEÁGYAZÁSA
    const fontPath = path.resolve(process.cwd(), 'public/fonts/Roboto-Regular.ttf');
    const fontBytes = fs.readFileSync(fontPath);
    const robotoFont = await pdfDoc.embedFont(fontBytes);

    const form = pdfDoc.getForm();

    // ✅ 3. AZ ÖSSZES SZÖVEGES MEZŐ BETŰTÍPUSÁNAK BEÁLLÍTÁSA EGYSZERRE
    const fields = form.getFields();
    fields.forEach(field => {
      // Csak a szöveges mezőket módosítjuk
      if (field instanceof PDFTextField) {
        field.defaultUpdateAppearances(robotoFont);
      }
    });

    // 4. Fejléc és kép mezők kitöltése
    for (const { appDataKey, pdfFieldName } of groundingPdfMapping.metadata) {
      const value = (formData as any)[appDataKey];
      if (value === undefined || value === '') continue;

      // KÜLÖN LOGIKA AZ ALÁÍRÁS KÉPNEK
      if (appDataKey === 'signature' && typeof value === 'string' && value.startsWith('data:image/png;base64,')) {
    try {
        // 1. Kép beágyazása
        const pngImage = await pdfDoc.embedPng(value);
        
        // 2. A mező lekérése
        const imageField = form.getField(pdfFieldName);
        
        // 3. Típusellenőrzés
        if (imageField instanceof PDFButton) {
            
            // 💡 A HELYES MEGOLDÁS:
            // A gomb belső 'acroField' objektumán hívjuk a getWidgets() metódust.
            const widgets = imageField.acroField.getWidgets();

            if (widgets && widgets.length > 0) {
                const { width, height } = widgets[0].getRectangle();
                
                // Arányos méretezés (opcionális, de hasznos)
                const scale = Math.min(width / pngImage.width, height / pngImage.height);

                // Kép beállítása
                imageField.setImage(pngImage);
                console.log(`✅ Signature image set for field: "${pdfFieldName}"`);
            } else {
                console.warn(`⚠️ Nem található widget a(z) "${pdfFieldName}" mezőhöz.`);
            }
        } else {
            console.warn(`⚠️ A(z) "${pdfFieldName}" mező nem gomb típusú.`);
        }
    } catch (e) {
        console.warn(`⚠️ Hiba az aláíráskép beillesztésekor a(z) '${pdfFieldName}' mezőbe:`, e);
    }
} 
      // A TÖBBI SZÖVEGES MEZŐ
      else {
        try {
          // ✅ Visszaállítva egy argumentumra! A betűtípust már fent beállítottuk.
          form.getTextField(pdfFieldName).setText(String(value));
        } catch {
          console.warn(`⚠️ Szöveges mező nem található vagy nem kompatibilis: "${pdfFieldName}"`);
        }
      }
    }

    // === EGYÉNI SZÖVEGEK BEÍRÁSA A PDF-BE ===
    if (formData.customGroundingTexts) {
      console.log('📝 Processing custom texts...');
      for (const [pdfFieldName, textValue] of Object.entries(formData.customGroundingTexts)) {
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

    // 5. Hibás válaszok összegyűjtése
    const remarks: { punkt: string; bemerkung: string }[] = [];
    groundingPdfMapping.answers.forEach(({ questionId, okFieldName, notOkFieldName }) => {
      const answer = formData.groundingCheckAnswers?.[questionId];
      if (!answer) return;
      try {
        if (answer === 'ok') {
          form.getTextField(okFieldName).setText('X');
        } else if (answer === 'not_ok') {
          form.getTextField(notOkFieldName).setText('X');
          const punkt = okFieldName.replace('OK', '');
          remarks.push({ punkt, bemerkung: `Hiba a ${punkt} pontnál.` });
        } else if (answer === 'not_applicable') {
          form.getTextField(okFieldName).setText('-');
        }
      } catch (e) { 
        console.warn(`⚠️ Hiba a(z) ${questionId} válasz beírásakor.`);
      }
    });

    // 6. Bemerkung mezők kitöltése - INTELLIGENS LOGIKA
    // Első hiba beírása (ha van)
    if (remarks.length >= 1) {
      try {
        const row1 = groundingPdfMapping.remarks[0];
        const punktField1 = form.getTextField(row1.punktField);
        punktField1.setText(remarks[0].punkt);
        punktField1.updateAppearances(robotoFont);

        const bemerkungField1 = form.getTextField(row1.bemerkungField);
        bemerkungField1.setText(remarks[0].bemerkung);
        bemerkungField1.updateAppearances(robotoFont);
      } catch (e) { console.warn(`⚠️ Hiba a Bemerkung 1. sor beírásakor.`); }
    }

    // Második sor tartalmának eldöntése
    if (remarks.length >= 2) {
      try {
        const row2 = groundingPdfMapping.remarks[1];
        let punktText = '';
        let bemerkungText = '';

        if (remarks.length > 2) {
          // Ha TÖBB MINT 2 hiba van, ide az üzenet kerül
          bemerkungText = "A további hibákat keresd a közös hibalistában";
        } else {
          // Ha PONTOSAN 2 hiba van, ide a második hiba kerül
          punktText = remarks[1].punkt;
          bemerkungText = remarks[1].bemerkung;
        }

        const punktField2 = form.getTextField(row2.punktField);
        punktField2.setText(punktText);
        punktField2.updateAppearances(robotoFont);

        const bemerkungField2 = form.getTextField(row2.bemerkungField);
        bemerkungField2.setText(bemerkungText);
        bemerkungField2.updateAppearances(robotoFont);
      } catch (e) { console.warn(`⚠️ Hiba a Bemerkung 2. sor beírásakor.`); }
    }
    
    // 7. PDF Kilapítása (Ez "ráégeti" a képet a gombra a helyes méretben)
    form.flatten();

    // 8. PDF Mentése
    const filledPdfBytes = await pdfDoc.save();
    return Buffer.from(filledPdfBytes);
  }
}