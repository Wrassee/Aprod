import { ProtocolError } from '../../shared/schema.js';
import * as XLSX from 'xlsx';
import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';
import fs from 'fs';
import path from 'path';

interface ProtocolData {
  buildingAddress?: string;
  liftId?: string;
  inspectorName?: string;
  inspectionDate?: string;
}

interface ExportData {
  errors: ProtocolError[];
  protocolData?: ProtocolData;
  language: 'hu' | 'de';
}

export class ErrorExportService {
  static async generateExcel(data: ExportData): Promise<Buffer> {
    const { errors, protocolData, language } = data;
    const translations = { 
      hu: { 
        title: 'OTIS Hibalista', building: 'Épület', liftId: 'Lift ID', inspector: 'Ellenőr', 
        date: 'Dátum', errorNumber: 'Hiba száma', severity: 'Súlyossági szint', 
        errorTitle: 'Hiba címe', description: 'Leírás', photos: 'Fotók száma', 
        critical: 'Kritikus', medium: 'Közepes', low: 'Alacsony', summary: 'Összesítő', 
        totalErrors: 'Összes hiba', generatedOn: 'Generálva' 
      }, 
      de: { 
        title: 'OTIS Fehlerliste', building: 'Gebäude', liftId: 'Aufzug ID', inspector: 'Prüfer', 
        date: 'Datum', errorNumber: 'Fehlernummer', severity: 'Schweregrad', 
        errorTitle: 'Fehler Titel', description: 'Beschreibung', photos: 'Anzahl Fotos', 
        critical: 'Kritisch', medium: 'Mittel', low: 'Niedrig', summary: 'Zusammenfassung', 
        totalErrors: 'Gesamtfehler', generatedOn: 'Erstellt am' 
      } 
    };
    
    const t = translations[language];
    const wb = XLSX.utils.book_new();
    
    const headerData = [ 
      [t.title], 
      [''], 
      [t.building, protocolData?.buildingAddress || ''], 
      [t.liftId, protocolData?.liftId || ''], 
      [t.inspector, protocolData?.inspectorName || ''], 
      [t.date, new Date().toLocaleDateString()], 
      [''], 
      [t.errorNumber, t.severity, t.errorTitle, t.description, t.photos] 
    ];
    
    const errorData = errors.map((error, index) => [ 
      index + 1, 
      t[error.severity as keyof typeof t] || error.severity, 
      error.title, 
      error.description, 
      error.images?.length || 0 
    ]);
    
    const summaryData = [ 
      [''], 
      [t.summary], 
      [t.totalErrors, errors.length], 
      [t.critical, errors.filter(e => e.severity === 'critical').length], 
      [t.medium, errors.filter(e => e.severity === 'medium').length], 
      [t.low, errors.filter(e => e.severity === 'low').length], 
      [''], 
      [t.generatedOn, new Date().toLocaleString()] 
    ];
    
    const allData = [...headerData, ...errorData, ...summaryData];
    const ws = XLSX.utils.aoa_to_sheet(allData);
    
    ws['!cols'] = [ 
      { wch: 10 }, 
      { wch: 15 }, 
      { wch: 30 }, 
      { wch: 50 }, 
      { wch: 12 } 
    ];
    
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let row = 0; row <= 7; row++) { 
      for (let col = 0; col <= 4; col++) { 
        const cellAddr = XLSX.utils.encode_cell({ r: row, c: col }); 
        if (!ws[cellAddr]) continue; 
        ws[cellAddr].s = { 
          font: row === 0 ? { bold: true, sz: 16 } : { bold: row === 7 }, 
          alignment: { horizontal: 'left' }, 
          fill: row === 0 ? { fgColor: { rgb: '1f4e79' } } : undefined 
        }; 
      } 
    }
    
    XLSX.utils.book_append_sheet(wb, ws, t.title);
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  static async generatePDF(data: ExportData): Promise<Buffer> {
    const { errors, protocolData, language } = data;

    const translations = {
      hu: {
        title: 'OTIS Hibalista', building: 'Épület', liftId: 'Lift ID',
        inspector: 'Ellenőr', date: 'Dátum', severity: 'Súlyossági szint',
        description: 'Leírás', photos: 'Fotók', critical: 'Kritikus',
        medium: 'Közepes', low: 'Alacsony', summary: 'Összesítő',
        totalErrors: 'Összes hiba', generatedOn: 'Generálva'
      },
      de: {
        title: 'OTIS Fehlerliste', building: 'Gebäude', liftId: 'Aufzug ID',
        inspector: 'Prüfer', date: 'Datum', severity: 'Schweregrad',
        description: 'Beschreibung', photos: 'Fotos', critical: 'Kritisch',
        medium: 'Mittel', low: 'Niedrig', summary: 'Zusammenfassung',
        totalErrors: 'Gesamtfehler', generatedOn: 'Erstellt am'
      }
    };

    const t = translations[language];

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8"><title>${t.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #1f4e79; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #1f4e79; margin: 0; font-size: 24px; }
          .info-table { width: 100%; margin-bottom: 30px; }
          .info-table td { padding: 5px; border-bottom: 1px solid #eee; }
          .error-item { margin-bottom: 20px; border: 1px solid #ddd; border-radius: 5px; padding: 15px; page-break-inside: avoid; }
          .error-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
          .severity { padding: 3px 8px; border-radius: 3px; color: white; font-weight: bold; font-size: 12px; }
          .severity-critical { background-color: #dc3545; }
          .severity-medium { background-color: #ffc107; color: #333; }
          .severity-low { background-color: #17a2b8; }
          .error-title { font-weight: bold; margin-bottom: 5px; }
          .error-description { color: #666; line-height: 1.4; }
          .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 30px; }
          .photo-count { font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header"><h1>${t.title}</h1></div>
        <table class="info-table">
          <tr><td><strong>${t.building}:</strong></td><td>${protocolData?.buildingAddress || ''}</td></tr>
          <tr><td><strong>${t.liftId}:</strong></td><td>${protocolData?.liftId || ''}</td></tr>
          <tr><td><strong>${t.inspector}:</strong></td><td>${protocolData?.inspectorName || ''}</td></tr>
          <tr><td><strong>${t.date}:</strong></td><td>${new Date().toLocaleDateString()}</td></tr>
        </table>
        ${errors.map((error, index) => `
          <div class="error-item">
            <div class="error-header">
              <span><strong>#${index + 1}</strong></span>
              <div>
                <span class="severity severity-${error.severity}">${t[error.severity as keyof typeof t] || error.severity}</span>
                ${error.images?.length ? `<span class="photo-count">${error.images.length} ${t.photos}</span>` : ''}
              </div>
            </div>
            <div class="error-title">${error.title}</div>
            <div class="error-description">${error.description}</div>
          </div>
        `).join('')}
        <div class="summary">
          <h3>${t.summary}</h3>
          <p><strong>${t.totalErrors}:</strong> ${errors.length}</p>
          <p><strong>${t.critical}:</strong> ${errors.filter(e => e.severity === 'critical').length}</p>
          <p><strong>${t.medium}:</strong> ${errors.filter(e => e.severity === 'medium').length}</p>
          <p><strong>${t.low}:</strong> ${errors.filter(e => e.severity === 'low').length}</p>
          <p><em>${t.generatedOn}: ${new Date().toLocaleString()}</em></p>
        </div>
      </body>
      </html>`;

    let browser = null;
    try {
      console.log('🎯 PDF Generation: Starting Puppeteer (hybrid mode)');

      // 🧠 AUTOMATIKUS PLATFORM FELISMERÉS
      const isWindows = process.platform === 'win32';

      browser = await puppeteer.launch({
        headless: true,
        args: isWindows ? [] : chromium.args,
        executablePath: isWindows
          ? 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
          : await chromium.executablePath(),
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfData = await page.pdf({
        format: 'A4',
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
        printBackground: true,
      });

      console.log('✅ PDF Generation OK, size:', pdfData.length);
      return Buffer.from(pdfData);

    } catch (error) {
      console.error('❌ PDF Generation Error (Puppeteer hybrid):', error);
      const message = `<h1>PDF generation failed</h1><pre>${(error as Error).message}</pre>`;
      return Buffer.from(message, 'utf-8');
    } finally {
      if (browser) await browser.close();
    }
  }
}