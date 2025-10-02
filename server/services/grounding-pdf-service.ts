import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { groundingPdfMapping } from '../config/grounding-pdf-mapping';
import { GroundingAnswer, FormData } from '../../shared/types'; // új típusokat importálunk

export class GroundingPdfService {
  static async generateFilledPdf(formData: FormData): Promise<Buffer> {
    const templatePath = path.resolve(
      process.cwd(),
      'public/templates/Erdungskontrolle.pdf'
    );
    const pdfBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    const form = pdfDoc.getForm();

    // 1. Fejléc mezők kitöltése
    groundingPdfMapping.metadata.forEach(({ appDataKey, pdfFieldName }) => {
      const value = (formData as any)[appDataKey];
      if (value !== undefined) {
        try {
          form.getTextField(pdfFieldName).setText(String(value));
        } catch {
          console.warn(`⚠️ Mező nem található: ${pdfFieldName}`);
        }
      }
    });

    // 2. Hibás válaszok összegyűjtése a Bemerkung táblázathoz
    const remarks: { punkt: string; bemerkung: string }[] = [];

    // 3. Válaszok feldolgozása (háromállapotú logika)
    groundingPdfMapping.answers.forEach(({ questionId, okFieldName, notOkFieldName }: { questionId: string; okFieldName: string; notOkFieldName: string }) => {
      const answer = formData.groundingCheckAnswers?.[questionId] as GroundingAnswer | undefined;
      if (!answer) return;

      if (answer === 'ok') {
        // OK → "X" az OK mezőbe
        try {
          form.getTextField(okFieldName).setText('X');
        } catch {
          console.warn(`⚠️ OK mező nem található: ${okFieldName}`);
        }
      } else if (answer === 'not_ok') {
        // Nem OK → "X" a nicht OK mezőbe
        try {
          form.getTextField(notOkFieldName).setText('X');
        } catch {
          console.warn(`⚠️ Nicht OK mező nem található: ${notOkFieldName}`);
        }

        // Bemerkunghoz hozzáadás
        const punkt = okFieldName.replace('OK', ''); // pl. OK2/4 → 2/4
        const bemerkung = formData.questionTexts?.[questionId] ?? questionId;
        remarks.push({ punkt, bemerkung });
      } else if (answer === 'not_applicable') {
        // Nem alkalmazható → "-" az OK mezőbe
        try {
          form.getTextField(okFieldName).setText('-');
        } catch {
          console.warn(`⚠️ N.A. mező nem található: ${okFieldName}`);
        }
      }
    });

    // 4. Bemerkung mezők kitöltése a gyűjtött hibák alapján
    groundingPdfMapping.remarks.forEach((row: { punktField: string; bemerkungField: string }, index: number) => {
      if (remarks[index]) {
        try {
          form.getTextField(row.punktField).setText(remarks[index].punkt);
          form.getTextField(row.bemerkungField).setText(remarks[index].bemerkung);
        } catch {
          console.warn(`⚠️ Bemerkung mező nem található: ${row.punktField}/${row.bemerkungField}`);
        }
      }
    });

    // 5. PDF mentése
    const filledPdfBytes = await pdfDoc.save();
    return Buffer.from(filledPdfBytes);
  }
}