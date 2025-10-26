import { ProtocolError } from '../../shared/schema.js';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { promises as fs } from 'fs';
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

    try {
      console.log('🎯 PDF Generation: Starting jsPDF with Unicode font support...');
      
      // Load Roboto font for Hungarian character support
      const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf');
      const fontBoldPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf');
      
      const fontBuffer = await fs.readFile(fontPath);
      const fontBoldBuffer = await fs.readFile(fontBoldPath);
      
      const fontBase64 = fontBuffer.toString('base64');
      const fontBoldBase64 = fontBoldBuffer.toString('base64');
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add custom fonts to support Hungarian characters (ő, ű, etc.)
      doc.addFileToVFS('Roboto-Regular.ttf', fontBase64);
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
      
      doc.addFileToVFS('Roboto-Bold.ttf', fontBoldBase64);
      doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
      
      // Set default font to Roboto
      doc.setFont('Roboto', 'normal');

      // Header
      doc.setFontSize(18);
      doc.setTextColor(31, 78, 121); // OTIS blue
      doc.text(t.title, 105, 20, { align: 'center' });
      
      doc.setDrawColor(31, 78, 121);
      doc.setLineWidth(0.5);
      doc.line(20, 25, 190, 25);

      // Protocol Info
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      let yPos = 35;
      
      if (protocolData?.buildingAddress) {
        doc.text(`${t.building}: ${protocolData.buildingAddress}`, 20, yPos);
        yPos += 6;
      }
      if (protocolData?.liftId) {
        doc.text(`${t.liftId}: ${protocolData.liftId}`, 20, yPos);
        yPos += 6;
      }
      if (protocolData?.inspectorName) {
        doc.text(`${t.inspector}: ${protocolData.inspectorName}`, 20, yPos);
        yPos += 6;
      }
      doc.text(`${t.date}: ${new Date().toLocaleDateString()}`, 20, yPos);
      yPos += 12;

      // Errors
      errors.forEach((error, index) => {
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        // Error number and severity
        doc.setFontSize(11);
        doc.setFont('Roboto', 'bold');
        doc.text(`#${index + 1}`, 20, yPos);
        
        // Severity badge
        const severityText = t[error.severity as keyof typeof t] as string || error.severity;
        const severityColors = {
          critical: [220, 53, 69],
          medium: [255, 193, 7],
          low: [23, 162, 184]
        };
        const color = severityColors[error.severity as keyof typeof severityColors] || [128, 128, 128];
        
        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(150, yPos - 4, 35, 6, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text(severityText, 167, yPos, { align: 'center' });
        
        yPos += 8;

        // Error title
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('Roboto', 'bold');
        const titleLines = doc.splitTextToSize(error.title, 170);
        doc.text(titleLines, 20, yPos);
        yPos += titleLines.length * 5;

        // Error description
        doc.setFont('Roboto', 'normal');
        doc.setTextColor(102, 102, 102);
        const descLines = doc.splitTextToSize(error.description, 170);
        doc.text(descLines, 20, yPos);
        yPos += descLines.length * 5;

        // Photos count
        if (error.images?.length) {
          doc.setFontSize(8);
          doc.text(`${error.images.length} ${t.photos}`, 20, yPos);
          yPos += 5;
        }

        yPos += 8; // Space between errors
      });

      // Summary
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFillColor(248, 249, 250);
      doc.rect(20, yPos, 170, 45, 'F');
      
      yPos += 8;
      doc.setFontSize(12);
      doc.setFont('Roboto', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(t.summary, 25, yPos);
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('Roboto', 'normal');
      doc.text(`${t.totalErrors}: ${errors.length}`, 25, yPos);
      yPos += 6;
      doc.text(`${t.critical}: ${errors.filter(e => e.severity === 'critical').length}`, 25, yPos);
      yPos += 6;
      doc.text(`${t.medium}: ${errors.filter(e => e.severity === 'medium').length}`, 25, yPos);
      yPos += 6;
      doc.text(`${t.low}: ${errors.filter(e => e.severity === 'low').length}`, 25, yPos);
      yPos += 8;
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`${t.generatedOn}: ${new Date().toLocaleString()}`, 25, yPos);

      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      console.log('✅ PDF Generation OK with jsPDF, size:', pdfBuffer.length);
      return pdfBuffer;

    } catch (error) {
      console.error('❌ PDF Generation Error (jsPDF):', error);
      const errorMessage = `PDF generation failed: ${(error as Error).message}`;
      return Buffer.from(errorMessage, 'utf-8');
    }
  }
}