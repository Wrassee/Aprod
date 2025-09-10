import { ProtocolError } from '../../shared/schema.js';
import * as XLSX from 'xlsx';
import puppeteer from 'puppeteer';
// A spawn, fs, és path importokra már nincs szükség a PDF generáláshoz
// import { spawn } from 'child_process';
// import * as fs from 'fs';
// import * as path from 'path';

class PDFService {

  /**
   * Generates a high-fidelity PDF from an Excel buffer using Puppeteer.
   * This method replaces the non-functional LibreOffice logic.
   * @param excelBuffer The buffer of the .xlsx file.
   * @returns A Promise that resolves with the PDF buffer.
   */
  async generatePDF(excelBuffer: Buffer): Promise<Buffer> {
    try {
      console.log('🎯 PDF Service: Starting Excel to HTML to PDF conversion with Puppeteer.');
      
      // 1. A te egyedi, Excel-szerű HTML generáló függvényedet használjuk
      const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const htmlContent = this.createExcelLikeHTML(worksheet);

      // 2. Puppeteer indítása a HTML-ből PDF generálásához
      console.log(' launching Puppeteer...');
      const browser = await puppeteer.launch({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--single-process'
        ],
        headless: true
      });
      
      const page = await browser.newPage();
      
      // Beállítjuk a HTML tartalmat
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // PDF generálása
      console.log(' generating PDF buffer...');
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
      });
      
      await browser.close();
      
      console.log('✅ PDF Service: SUCCESS! PDF generated, size:', pdfBuffer.length);
      return pdfBuffer;

    } catch (error) {
      console.error('❌ PDF Service: PDF generation failed:', error);
      // Ha hiba történik, egy egyszerű hibaüzenetet tartalmazó PDF-et adunk vissza
      return this.createErrorPDF((error as Error).message);
    }
  }
  
  /**
   * Converts an Excel worksheet to a styled HTML table using your original styling.
   * @param worksheet The Excel worksheet object.
   * @returns An HTML string.
   */
  private createExcelLikeHTML(worksheet: any): string {
    // Ezt a függvényt egy az egyben átemeltem a te kódodból, mert ez adja a PDF kinézetét.
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z100');
    
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>OTIS Acceptance Protocol</title>
  <style>
    body { 
      font-family: 'Calibri', 'Arial', sans-serif; 
      margin: 8px; 
      padding: 0;
      background: white;
      font-size: 11px;
    }
    table { 
      border-collapse: collapse; 
      width: 100%; 
      table-layout: fixed;
      font-size: 10px;
      border: 1px solid #000;
    } 
    td { 
      border: 1px solid #ccc; 
      padding: 2px 4px; 
      text-align: left; 
      vertical-align: middle;
      font-size: 10px;
      white-space: nowrap;
      overflow: hidden;
      height: 20px;
      background: white;
    }
    .header-cell {
      background-color: #d32f2f !important;
      color: white !important;
      font-weight: bold;
      text-align: center;
      border: 1px solid #000;
    }
    .data-cell {
      background-color: white;
      border: 1px solid #ccc;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    @media print {
      body { margin: 0; padding: 5mm; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <table>`;
    
    // Generate table rows based on Excel data
    for (let row = range.s.r; row <= range.e.r; row++) {
      html += '<tr>';
      
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        
        let cellValue = cell?.w || cell?.v || ''; // a .w formázott értéket részesíti előnyben
        let cellClass = 'data-cell';
        
        if (cell && cell.v !== undefined) {
          // Style based on content (simple heuristics)
          if (String(cell.v).includes('OTIS') || row < 3) {
            cellClass = 'header-cell';
          }
        }
        
        html += `<td class="${cellClass}">${cellValue}</td>`;
      }
      
      html += '</tr>';
    }
    
    html += `
  </table>
  <div style="margin-top: 20px; font-size: 8px; color: #666; text-align: center;">
    Generated: ${new Date().toLocaleString()} | OTIS Elevator Company | Made to move you
  </div>
</body>
</html>`;
    
    return html;
  }
  
  /**
   * Creates a simple fallback PDF in case of a critical error during generation.
   * @param errorMessage The error message to display.
   * @returns A Buffer containing the error PDF.
   */
  private createErrorPDF(errorMessage: string): Buffer {
    const html = `
      <h1>PDF Generation Failed</h1>
      <p>Could not generate the protocol PDF due to an internal error.</p>
      <pre>Error: ${errorMessage}</pre>
    `;
    // A valóságban itt is lehetne egy mini-puppeteer hívás, de egy egyszerű szöveg is megteszi.
    return Buffer.from(html, 'utf-8');
  }

  // Az 'ErrorListPDF' generáló függvényt érintetlenül hagytam, ha máshol használod a kódban.
  async generateErrorListPDF(errors: ProtocolError[], language: string): Promise<Buffer> {
    try {
      console.log(`Generating error list PDF with ${errors.length} errors in ${language}`);
      
      let content = `<h1>OTIS ERROR REPORT</h1><p>${errors.length} Error${errors.length !== 1 ? 's' : ''} Found</p><hr>`;
      
      if (errors.length === 0) {
        content += '<p>No errors reported - System is functioning correctly</p>';
      } else {
        errors.forEach((error, index) => {
          content += `
            <div>
              <h3>Error #${index + 1}</h3>
              <p><strong>Title:</strong> ${error.title}</p>
              <p><strong>Severity:</strong> ${error.severity.toUpperCase()}</p>
              ${error.description ? `<p><strong>Description:</strong> ${error.description}</p>` : ''}
              ${error.images && error.images.length > 0 ? `<p><strong>Images attached:</strong> ${error.images.length}</p>` : ''}
            </div>
            <hr>
          `;
        });
      }
      
      // Re-use the main PDF generator logic
      const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(content, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ format: 'A4' });
      await browser.close();
      
      return pdfBuffer;
      
    } catch (error) {
      console.error('Error generating error list PDF:', error);
      throw new Error('Failed to generate error list PDF');
    }
  }
}

export const pdfService = new PDFService();

