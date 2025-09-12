import { ProtocolError } from '../../shared/schema.js';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

// A parancssori folyamatok futtatását "Promise" alapúvá alakítjuk
const execPromise = promisify(exec);

class PDFService {

  async generatePDF(excelBuffer: Buffer): Promise<Buffer> {
    const tempDir = '/app/temp'; // A Dockerfile-ban létrehozott ideiglenes mappa
    const uniqueId = Date.now();
    const excelPath = path.join(tempDir, `protocol-${uniqueId}.xlsx`);
    const pdfPath = path.join(tempDir, `protocol-${uniqueId}.pdf`);

    try {
      console.log(`🎯 PDF Service (LibreOffice): Writing Excel buffer to ${excelPath}`);
      // 1. Az Excel puffert kiírjuk egy ideiglenes fájlba
      await fs.writeFile(excelPath, excelBuffer);

      // 2. A LibreOffice parancs meghívása a konvertáláshoz
      const command = `soffice --headless --convert-to pdf "${excelPath}" --outdir "${tempDir}"`;
      console.log(`Executing LibreOffice command: ${command}`);
      
      // A parancsnak max 2 percet adunk a futásra
      const { stdout, stderr } = await execPromise(command, { timeout: 120000 });
      if (stderr) {
        console.error('LibreOffice STDERR:', stderr);
      }
      console.log('LibreOffice STDOUT:', stdout);
      console.log(`✅ Conversion complete. PDF should be at ${pdfPath}`);

      // 3. A legenerált PDF fájl beolvasása bufferbe
      const pdfBuffer = await fs.readFile(pdfPath);
      console.log(`✅ PDF Service: SUCCESS! PDF generated, size: ${pdfBuffer.length}`);
      
      return pdfBuffer;

    } catch (error) {
      console.error('❌ PDF Service (LibreOffice): PDF generation failed:', error);
      // Hiba esetén egy egyszerű szöveges hibaoldalt generálunk
      return this.createErrorPDF((error as Error).message);
    } finally {
      // 4. Mindig letakarítjuk az ideiglenes fájlokat
      try {
        await fs.unlink(excelPath);
        await fs.unlink(pdfPath);
        console.log('✅ Cleaned up temporary files.');
      } catch (cleanupError) {
        console.warn('Could not clean up temporary files:', cleanupError);
      }
    }
  }
  
  private createErrorPDF(errorMessage: string): Buffer {
    const html = `<h1>PDF Generation Failed</h1><p>Could not generate the protocol PDF.</p><pre>Error: ${errorMessage}</pre>`;
    return Buffer.from(html, 'utf-8');
  }

  // Ez a funkció már nem releváns, de a hivatkozások miatt a fájlban marad
  async generateErrorListPDF(): Promise<Buffer> {
     throw new Error("This function is deprecated. Use ErrorExportService.generatePDF instead.");
  }
}

export const pdfService = new PDFService();