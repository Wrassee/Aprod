// server/services/grounding-pdf-service.ts – JAVÍTOTT NYELVKEZELÉS (v11)

import { PDFDocument, PDFTextField, PDFButton } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';
import { groundingPdfMapping } from '../config/grounding-pdf-mapping.js';
import { GroundingAnswer, FormData } from '../../shared/types.js';

export class GroundingPdfService {
  // 🔥 MÓDOSÍTÁS: Hozzáadtuk a 'language' paramétert (alapértelmezett: 'hu')
  static async generateFilledPdf(formData: FormData, language: string = 'hu'): Promise<Buffer> {
    console.log(`--- FUT A PDF GENERÁTOR (Nyelv: ${language}) ---`);

    // 1️⃣ PDF és betűtípusok előkészítése
    const templatePath = path.resolve(process.cwd(), 'public/templates/Erdungskontrolle.pdf');
    const pdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    pdfDoc.registerFontkit(fontkit);

    const regularFontPath = path.resolve(process.cwd(), 'public/fonts/Roboto-Regular.ttf');
    const boldFontPath = path.resolve(process.cwd(), 'public/fonts/Roboto-Bold.ttf');
    const regularFontBytes = fs.readFileSync(regularFontPath);
    const boldFontBytes = fs.readFileSync(boldFontPath);
    const robotoFont = await pdfDoc.embedFont(regularFontBytes);
    const robotoBold = await pdfDoc.embedFont(boldFontBytes);
    
    const form = pdfDoc.getForm();

    // 2️⃣ Alapadatok és egyéni szövegek kitöltése
    const allTextFields: { [key: string]: string | undefined } = { ...formData.customGroundingTexts };
    groundingPdfMapping.metadata.forEach(meta => {
        if (meta.appDataKey !== 'signature' && (formData as any)[meta.appDataKey]) {
            allTextFields[meta.pdfFieldName] = (formData as any)[meta.appDataKey];
        }
    });

    for (const [pdfFieldName, textValue] of Object.entries(allTextFields)) {
        if (textValue && typeof textValue === 'string') {
            try {
                const field = form.getTextField(pdfFieldName);
                field.setText(textValue);
                field.updateAppearances(robotoFont);
            } catch (e) {
                console.warn(`⚠️ Szöveges mező nem található: "${pdfFieldName}"`);
            }
        }
    }
    
    // 3️⃣ Aláírás beillesztése
    const signatureValue = formData.signature;
    if (signatureValue && typeof signatureValue === 'string' && signatureValue.startsWith('data:image/png;base64,')) {
        try {
            const pngImage = await pdfDoc.embedPng(signatureValue);
            const imageField = form.getButton('signature');
            imageField.setImage(pngImage);
        } catch(e) {
            console.warn(`⚠️ Hiba az aláíráskép beillesztésekor:`, e);
        }
    }

    // 4️⃣ Földelési kérdések (OK / nicht OK / -)
    const remarks: { punkt: string; bemerkung: string }[] = [];
    groundingPdfMapping.answers.forEach(({ questionId, okFieldName, notOkFieldName }) => {
      const answer = formData.groundingCheckAnswers?.[questionId];
      if (!answer) return;

      try {
        if (answer === 'ok' || answer === 'not_ok' || answer === 'not_applicable') {
            const isNotOk = answer === 'not_ok';
            const fieldName = isNotOk ? notOkFieldName : okFieldName;
            const textToSet = answer === 'not_applicable' ? '-' : 'X';

            const field = form.getTextField(fieldName);
            field.setText(textToSet);
            field.updateAppearances(robotoBold); 
            
            if (isNotOk) {
                const punkt = okFieldName.replace('OK', '');
                
                // Nyelvfüggő hiba leírás keresése
                const specificError = formData.errors?.find(err => (err as any).context === questionId);

                let bemerkungText = language === 'hu' 
                    ? `Hiba a ${punkt} pontnál.` 
                    : `Fehler bei Punkt ${punkt}.`;

                if (specificError && specificError.description) {
                    bemerkungText = specificError.description;
                }

                remarks.push({ punkt, bemerkung: bemerkungText });
            }
        }
      } catch (e) { 
        console.warn(`⚠️ Hiba a(z) ${questionId} válasz beírásakor.`, e);
      }
    });

    // 5️⃣ Bemerkung mezők kitöltése - 🔥 JAVÍTOTT RÉSZ
    if (remarks.length >= 1) {
        try {
            const row1 = groundingPdfMapping.remarks[0];
            const punktField1 = form.getTextField(row1.punktField);
            punktField1.setText(remarks[0].punkt);
            punktField1.updateAppearances(robotoBold);

            const bemerkungField1 = form.getTextField(row1.bemerkungField);
            bemerkungField1.setText(remarks[0].bemerkung);
            bemerkungField1.updateAppearances(robotoBold);
        } catch (e) { console.warn(`⚠️ Hiba a Bemerkung 1. sor beírásakor.`); }
    }
    
    if (remarks.length >= 2) {
        try {
            const row2 = groundingPdfMapping.remarks[1];
            const punktField2 = form.getTextField(row2.punktField);
            const bemerkungField2 = form.getTextField(row2.bemerkungField);

            if (remarks.length > 2) {
                // 🔥 ITT VOLT A HIBA - MOST MÁR NYELVFÜGGŐ
                const limitText = language === 'hu' 
                    ? 'A további hibákat keresd a közös hibalistában' 
                    : 'Weitere Fehler finden Sie in der gemeinsamen Fehlerliste';
                
                bemerkungField2.setText(limitText);
                punktField2.setText('');
            } else {
                punktField2.setText(remarks[1].punkt);
                bemerkungField2.setText(remarks[1].bemerkung);
            }
            punktField2.updateAppearances(robotoBold);
            bemerkungField2.updateAppearances(robotoBold);
        } catch (e) { console.warn(`⚠️ Hiba a Bemerkung 2. sor beírásakor.`); }
    }
    
    // 6️⃣ Eredmény mezők automatikus kitöltése
    try {
        const hasErrorInGroup = (groupPrefix: string) => {
            const questionsInGroup = groundingPdfMapping.answers.filter(
                q => q.questionId.startsWith(groupPrefix)
            );
            return questionsInGroup.some(
                question => formData.groundingCheckAnswers?.[question.questionId] === 'not_ok'
            );
        };

        // X1: OK1/ (Maschinenraum)
        if (hasErrorInGroup('OK1/')) {
            const field = form.getTextField('X1');
            field.setText('X');
            field.updateAppearances(robotoBold);
        }

        // X2: OK2/ - OK5/
        const hasErrorInX2 = hasErrorInGroup('OK2/') || hasErrorInGroup('OK3/') || hasErrorInGroup('OK4/') || hasErrorInGroup('OK5/');
        if (hasErrorInX2) {
            const field = form.getTextField('X2');
            field.setText('X');
            field.updateAppearances(robotoBold);
        }

        // X3: OK1 ÉS (OK2...OK5)
        if (hasErrorInGroup('OK1/') && hasErrorInX2) {
            const field = form.getTextField('X3');
            field.setText('X');
            field.updateAppearances(robotoBold);
        }

        // X4: Bármelyik
        if (hasErrorInGroup('OK1/') || hasErrorInX2) {
            const field = form.getTextField('X4');
            field.setText('X');
            field.updateAppearances(robotoBold);
        }

    } catch (e) {
        console.warn(`⚠️ Hiba az eredmény mezők kitöltésekor.`, e);
    }
    
    form.flatten();
    const filledPdfBytes = await pdfDoc.save();
    return Buffer.from(filledPdfBytes);
  }
}