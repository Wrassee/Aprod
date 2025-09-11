import { ProtocolError } from '../../shared/schema.js';
import * as XLSX from 'xlsx';
// --- MÓDOSÍTVA: A megfelelő, szerverbarát csomagok importálása ---
import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';

class PDFService {

  async generatePDF(excelBuffer: Buffer): Promise<Buffer> {
    let browser = null;
    try {
      console.log('🎯 PDF Service: Starting PDF conversion with @sparticuz/chromium.');
      
      const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const htmlContent = this.createExcelLikeHTML(worksheet);

      console.log(' launching Puppeteer with optimized settings...');

      // --- MÓDOSÍTVA: Stabil, szerver-oldali beállítások használata ---
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
      
      const page = await browser.newPage();
      
      await page.setContent(htmlContent, { waitUntil: 'networkidle0', timeout: 0 });
      
      console.log(' generating PDF buffer...');
      const pdfData = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
        timeout: 0
      });
      
      const pdfBuffer = Buffer.from(pdfData);
      
      console.log('✅ PDF Service: SUCCESS! PDF generated, size:', pdfBuffer.length);
      return pdfBuffer;

    } catch (error) {
      console.error('❌ PDF Service: PDF generation failed:', error);
      return this.createErrorPDF((error as Error).message);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
  
  private createExcelLikeHTML(worksheet: XLSX.WorkSheet): string {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z100');
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>OTIS Acceptance Protocol</title><style>body{font-family:'Calibri','Arial',sans-serif;margin:8px;padding:0;background:white;font-size:11px}table{border-collapse:collapse;width:100%;table-layout:fixed;font-size:10px;border:1px solid #000}td{border:1px solid #ccc;padding:2px 4px;text-align:left;vertical-align:middle;font-size:10px;white-space:nowrap;overflow:hidden;height:20px;background:white}.header-cell{background-color:#d32f2f !important;color:white !important;font-weight:bold;text-align:center;border:1px solid #000}.data-cell{background-color:white;border:1px solid #ccc}.center{text-align:center}.bold{font-weight:bold}@media print{body{margin:0;padding:5mm}table{page-break-inside:auto}tr{page-break-inside:avoid}}</style></head><body><table>`;
    
    for (let row = range.s.r; row <= range.e.r; row++) {
      html += '<tr>';
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        let cellValue = cell?.w || cell?.v || '';
        let cellClass = 'data-cell';
        if (cell && cell.v !== undefined && (String(cell.v).includes('OTIS') || row < 3)) {
          cellClass = 'header-cell';
        }
        html += `<td class="${cellClass}">${cellValue}</td>`;
      }
      html += '</tr>';
    }
    
    html += `</table><div style="margin-top:20px;font-size:8px;color:#666;text-align:center;">Generated: ${new Date().toLocaleString()} | OTIS Elevator Company | Made to move you</div></body></html>`;
    return html;
  }
  
  private createErrorPDF(errorMessage: string): Buffer {
    const html = `<h1>PDF Generation Failed</h1><p>Could not generate the protocol PDF.</p><pre>Error: ${errorMessage}</pre>`;
    return Buffer.from(html, 'utf-8');
  }

  async generateErrorListPDF(errors: ProtocolError[], language: string): Promise<Buffer> {
     // This function is now handled by ErrorExportService to keep concerns separate.
     throw new Error("This function is deprecated. Use ErrorExportService.generatePDF instead.");
  }
}

export const pdfService = new PDFService();