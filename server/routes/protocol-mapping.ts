// server/routes/protocol-mapping.ts
import { Router } from 'express';
import { z } from 'zod';
import { supabaseStorage } from '../services/supabase-storage.js';
import { storage } from '../storage.js';
import { insertProtocolSchema } from '../../shared/schema.js';
import { pdfService } from '../services/pdf-service.js';
import { GroundingPdfService } from '../services/grounding-pdf-service.js';

const router = Router();

// PROTOKOLL LÉTREHOZÁSA
router.post('/', async (req, res) => {
  try {
    const protocolData = insertProtocolSchema.parse(req.body);
    const protocol = await storage.createProtocol(protocolData);
    res.json(protocol);
  } catch (error) {
    console.error("Error creating protocol:", error);
    res.status(400).json({ message: "Invalid protocol data" });
  }
});

// EXCEL LETÖLTÉS
router.post('/download-excel', async (req, res) => {
  try {
    console.log("Excel download request received");
    const { formData, language } = req.body;
    
    if (!formData) {
      return res.status(400).json({ message: "Form data is required" });
    }
    
    const { simpleXmlExcelService } = await import('../services/simple-xml-excel.js');
    
    console.log("Generating Excel with XML service...");
    const excelBuffer = await simpleXmlExcelService.generateExcelFromTemplate(formData, language || 'hu');

    if (!excelBuffer || excelBuffer.length < 1000) {
      throw new Error('Generated Excel buffer is invalid or too small');
    }

    const liftId = formData.answers && formData.answers['7'] ? 
                    String(formData.answers['7']).replace(/[^a-zA-Z0-9]/g, '_') : 
                    'Unknown';
    const filename = `OTIS_Protocol_${liftId}_${new Date().toISOString().split('T')[0]}.xlsx`;

    console.log(`Excel generated successfully: ${filename} (${excelBuffer.length} bytes)`);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length.toString());
    
    res.send(excelBuffer);

  } catch (error) {
    console.error("Error generating Excel download:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    res.status(500).json({ 
      message: "Failed to generate Excel file",
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
});

// PDF LETÖLTÉS
router.post('/download-pdf', async (req, res) => {
  try {
    console.log("PDF download request received");
    const { formData, language } = req.body;
    if (!formData) return res.status(400).json({ message: "Form data is required" });

    // 1. Először legeneráljuk az Excel fájlt ugyanazzal a logikával
    const { simpleXmlExcelService } = await import('../services/simple-xml-excel.js');
    const excelBuffer = await simpleXmlExcelService.generateExcelFromTemplate(formData, language || 'hu');

    // 2. Az Excel bufferből legeneráljuk a PDF-et a javított pdfService segítségével
    console.log("Generating PDF from Excel buffer...");
    const pdfBuffer = await pdfService.generatePDF(excelBuffer);

    const liftId = formData.answers?.['7'] ? String(formData.answers['7']).replace(/[^a-zA-Z0-9]/g, '_') : 'Unknown';
    const filename = `OTIS_Protocol_${liftId}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    console.log(`PDF generated successfully: ${filename} (${pdfBuffer.length} bytes)`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error("Error generating PDF download:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    res.status(500).json({ message: "Failed to generate PDF file", error: errorMessage });
  }
});

// FÖLDELÉSI PDF LETÖLTÉS
router.post('/download-grounding-pdf', async (req, res) => {
  try {
    const formData = req.body.formData;

    if (!formData) {
      return res.status(400).json({ message: "Hiányzó formData a kérésben." });
    }

    console.log('⚡️ Received request to generate grounding PDF...');
    
    // Meghívjuk a PDF-kezelő szolgáltatásunkat
    const pdfBuffer = await GroundingPdfService.generateFilledPdf(formData);

    // Visszaküldjük a generált PDF fájlt a böngészőnek
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Erdungskontrolle_${formData.liftId || 'jegyzokonyv'}.pdf"`);
    res.send(pdfBuffer);
    
    console.log('✅ Grounding PDF successfully generated and sent.');

  } catch (error) {
    console.error('❌ Hiba a földelési PDF generálása közben:', error);
    res.status(500).json({ message: 'Szerverhiba a PDF generálása közben.' });
  }
});

export { router as protocolMappingRoutes };