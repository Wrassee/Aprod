// server/services/grounding-pdf-service.ts – VÉGLEGES, DEPLOY-BIZTOS VERZIÓ (v10)

import { PDFDocument, PDFTextField, PDFButton } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';
import { groundingPdfMapping } from '../config/grounding-pdf-mapping.js';
import { GroundingAnswer, FormData } from '../../shared/types.js';

export class GroundingPdfService {
  static async generateFilledPdf(formData: FormData): Promise<Buffer> {
    console.log('--- FUT A DEPLOY-BIZTOS, VASTAG BETŰS VERZIÓ! v10 ---');

    // 1️⃣ PDF és betűtípusok előkészítése (Helyes sorrend)
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
    // Összegyűjtjük az összes kitöltendő szöveges mezőt
    const allTextFields: { [key: string]: string | undefined } = { ...formData.customGroundingTexts };
    groundingPdfMapping.metadata.forEach(meta => {
        if (meta.appDataKey !== 'signature' && (formData as any)[meta.appDataKey]) {
            allTextFields[meta.pdfFieldName] = (formData as any)[meta.appDataKey];
        }
    });

    // Ciklus a szöveges mezők kitöltésére a sima betűtípussal
    for (const [pdfFieldName, textValue] of Object.entries(allTextFields)) {
        if (textValue && typeof textValue === 'string') {
            try {
                const field = form.getTextField(pdfFieldName);
                field.setText(textValue);
                field.updateAppearances(robotoFont); // Sima betűtípus a fejléchez és egyéni szövegekhez
            } catch (e) {
                console.warn(`⚠️ Szöveges mező nem található vagy nem kompatibilis: "${pdfFieldName}"`);
            }
        }
    }
    
    // 3️⃣ Aláírás beillesztése (külön kezelve)
    const signatureValue = formData.signature;
    if (signatureValue && typeof signatureValue === 'string' && signatureValue.startsWith('data:image/png;base64,')) {
        try {
            const pngImage = await pdfDoc.embedPng(signatureValue);
            const imageField = form.getButton('signature');
            imageField.setImage(pngImage);
            console.log('✅ Signature image inserted');
        } catch(e) {
            console.warn(`⚠️ Hiba az aláíráskép beillesztésekor:`, e);
        }
    }

    // 4️⃣ Földelési kérdések (OK / nicht OK / -) - NYELVFÜGGŐ HIBAKIÍRÁSSAL
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
            // ✅ A GARANTÁLTAN MŰKÖDŐ METÓDUS: Csak a VASTAG betűtípust adjuk át
            field.updateAppearances(robotoBold); 
            
            if (isNotOk) {
                const punkt = okFieldName.replace('OK', '');
                
                // --- ÚJ LOGIKA: NYELVFÜGGŐ HIBALEÍRÁS ---
                // 1. Keressük meg a konkrét hibát a formData.errors tömbben az aktuális questionId alapján
                const specificError = formData.errors?.find(err => (err as any).context === questionId);

                // 2. A hiba leírása a 'bemerkung' mezőbe. Ha nem találunk konkrét hibát, egy általános szöveg lesz a tartalék.
                let bemerkungText = `Hiba a ${punkt} pontnál.`; // Alapértelmezett, tartalék szöveg
                if (specificError && specificError.description) {
                    bemerkungText = specificError.description; // Felülírjuk a konkrét, nyelvfüggő leírással
                }

                // 3. A remarks tömbhöz már a dinamikus szöveget adjuk hozzá
                remarks.push({ punkt, bemerkung: bemerkungText });
            }
        }
      } catch (e) { 
        console.warn(`⚠️ Hiba a(z) ${questionId} válasz beírásakor.`, e);
      }
    });

    // 5️⃣ Bemerkung mezők kitöltése
    if (remarks.length >= 1) {
        try {
            const row1 = groundingPdfMapping.remarks[0];
            const punktField1 = form.getTextField(row1.punktField);
            punktField1.setText(remarks[0].punkt);
            punktField1.updateAppearances(robotoBold); // Legyen a hiba is vastag

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
                bemerkungField2.setText('A további hibákat keresd a közös hibalistában');
                punktField2.setText('');
            } else {
                punktField2.setText(remarks[1].punkt);
                bemerkungField2.setText(remarks[1].bemerkung);
            }
            punktField2.updateAppearances(robotoBold);
            bemerkungField2.updateAppearances(robotoBold);
        } catch (e) { console.warn(`⚠️ Hiba a Bemerkung 2. sor beírásakor.`); }
    }
    
    // ====================================================================
    // ✅ ÚJ BLOKK: EREDMÉNY MEZŐK AUTOMATIKUS KITÖLTÉSE (EGYEDI LOGIKÁVAL)
    // ====================================================================
    try {
        console.log('📊 Eredmény mezők kiértékelése...');

        // Segédfüggvény: van-e hiba egy adott csoportban
        const hasErrorInGroup = (groupPrefix: string) => {
            const questionsInGroup = groundingPdfMapping.answers.filter(
                q => q.questionId.startsWith(groupPrefix)
            );
            return questionsInGroup.some(
                question => formData.groundingCheckAnswers?.[question.questionId] === 'not_ok'
            );
        };

        // X1: Hiba van az OK1/ (Maschinenraum) csoportban
        const hasErrorInX1 = hasErrorInGroup('OK1/');
        if (hasErrorInX1) {
            console.log(`❗️ Hiba észlelve az OK1/ csoportban. X1 mező bejelölése.`);
            const field = form.getTextField('X1');
            field.setText('X');
            field.updateAppearances(robotoBold);
        }

        // X2: Hiba van az OK2/ - OK5/ BÁRMELYIK csoportban
        const hasErrorInX2 = hasErrorInGroup('OK2/') || 
                             hasErrorInGroup('OK3/') || 
                             hasErrorInGroup('OK4/') || 
                             hasErrorInGroup('OK5/');
        if (hasErrorInX2) {
            console.log(`❗️ Hiba észlelve az OK2/-OK5/ csoportok valamelyikében. X2 mező bejelölése.`);
            const field = form.getTextField('X2');
            field.setText('X');
            field.updateAppearances(robotoBold);
        }

        // X3: Hiba van az OK1/ ÉS (OK2/ - OK5/ valamelyikében)
        const hasErrorInX3 = hasErrorInX1 && hasErrorInX2;
        if (hasErrorInX3) {
            console.log(`❗️ Hiba észlelve az OK1/ ÉS OK2/-OK5/ csoportokban. X3 mező bejelölése.`);
            const field = form.getTextField('X3');
            field.setText('X');
            field.updateAppearances(robotoBold);
        }

        // X4: Hiba van BÁRMELYIK csoportban (OK1/ - OK5/)
        const hasErrorInX4 = hasErrorInGroup('OK1/') || 
                             hasErrorInGroup('OK2/') || 
                             hasErrorInGroup('OK3/') || 
                             hasErrorInGroup('OK4/') || 
                             hasErrorInGroup('OK5/');
        if (hasErrorInX4) {
            console.log(`❗️ Hiba észlelve valamelyik csoportban. X4 mező bejelölése.`);
            const field = form.getTextField('X4');
            field.setText('X');
            field.updateAppearances(robotoBold);
        }

        // X5: Nincs automatikus logika - kézi kitöltésre hagyva
        console.log('ℹ️ X5 mező kézi kitöltésre hagyva (utóellenőrzés).');

    } catch (e) {
        console.warn(`⚠️ Hiba történt az eredmény mezők automatikus kitöltése során.`, e);
    }
    
    // 6️⃣ Véglegesítés és mentés
    form.flatten();
    const filledPdfBytes = await pdfDoc.save();
    return Buffer.from(filledPdfBytes);
  }
}