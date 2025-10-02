// server/routes/protocol-mapping.ts
import { Router } from 'express';
import { z } from 'zod';
import { supabaseStorage } from '../services/supabase-storage.js';
import { storage } from '../storage.js';
import { insertProtocolSchema } from '../../shared/schema.js';
import { pdfService } from '../services/pdf-service.js';
import { GroundingPdfService } from '../services/grounding-pdf-service.js';

const router = Router();

// Request validation schema for mapping
const writeProtocolSchema = z.object({
  protocolId: z.string().min(1, 'Protocol ID kötelező'),
  writes: z.array(z.object({
    questionId: z.string().min(1, 'Question ID kötelező'),
    value: z.union([z.string(), z.number(), z.null()])
  })).min(1, 'Legalább egy írási művelet szükséges')
});

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

    // 1. Generate Excel with grounding-specific data using the specialized service
    const { groundingExcelService } = await import('../services/grounding-excel-service.js');
    console.log("Generating grounding Excel buffer...");
    const excelBuffer = await groundingExcelService.generateGroundingExcel(formData, language || 'hu');

    if (!excelBuffer || excelBuffer.length < 1000) {
      throw new Error('Generated grounding Excel buffer is invalid or too small');
    }
    console.log(`Grounding Excel buffer generated: ${excelBuffer.length} bytes`);

    // 2. Convert Excel buffer to PDF using the PDF service
    console.log("Converting grounding Excel to PDF...");
    const pdfBuffer = await pdfService.generatePDF(excelBuffer);

    if (!pdfBuffer || pdfBuffer.length < 100) {
      throw new Error('Generated grounding PDF buffer is invalid or too small');
    }

    const liftId = formData.answers?.['7'] ? String(formData.answers['7']).replace(/[^a-zA-Z0-9]/g, '_') : 'Unknown';
    const filename = `OTIS_Grounding_Protocol_${liftId}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    console.log(`Grounding PDF generated successfully: ${filename} (${pdfBuffer.length} bytes)`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error("Error generating grounding PDF download:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    res.status(500).json({ 
      message: "Failed to generate grounding PDF file", 
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
    });
  }
});

// NIEDERVOLT MAPPING - Protocol írás
router.post('/write-mapping', async (req, res) => {
  try {
    console.log('📝 Protocol mapping write request received');
    
    // Request validálás
    const { protocolId, writes } = writeProtocolSchema.parse(req.body);
    console.log(`📋 Processing ${writes.length} writes for protocol ${protocolId}`);
    
    // 1. Template mapping betöltése (szerver oldali hardcoded fallback)
    console.log('📂 Loading template mapping...');
    
    // Szerver oldali mapping betöltés (hardcoded fallback)
    let cellMappings = [
      // Hardcoded Niedervolt mapping-ek próbához
      { questionId: 'Q_NID_device1_biztositek', cellReference: 'B10', sheetName: 'Sheet1' },
      { questionId: 'Q_NID_device1_kismegszakito', cellReference: 'C10', sheetName: 'Sheet1' },
      { questionId: 'Q_NID_device1_fiIn', cellReference: 'D10', sheetName: 'Sheet1' },
      { questionId: 'Q_NID_device1_fiDin', cellReference: 'E10', sheetName: 'Sheet1' },
      // Több mapping később lesz implementálva
    ];
    
    console.log(`📋 Loaded ${cellMappings.length} cell mappings (hardcoded fallback)`);
    
    // 2. Otis protokoll letöltése
    let protocolBuffer;
    try {
      // Feltételezzük, hogy a protocolId egy Supabase fájl elérési út
      const protocolPath = `otis-protocols/${protocolId}/protocol.xlsx`;
      const localPath = `/tmp/protocol-${protocolId}.xlsx`;
      await supabaseStorage.downloadFile(protocolPath, localPath);
      
      // Local fájl beolvasása ArrayBuffer-ként
      const fs = await import('fs/promises');
      const buffer = await fs.readFile(localPath);
      protocolBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      
      console.log(`📄 Downloaded protocol (${protocolBuffer.byteLength} bytes)`);
      
    } catch (downloadError) {
      console.error('❌ Protocol download error:', downloadError);
      return res.status(404).json({
        success: false,
        error: 'Otis protokoll nem található',
        protocolId,
        details: String(downloadError)
      });
    }
    
    // 3. Write operations előkészítése mapping alapján
    const cellWrites = [];
    const missingMappings = [];
    
    for (const write of writes) {
      const mapping = cellMappings.find(m => m.questionId === write.questionId);
      if (mapping) {
        cellWrites.push({
          questionId: write.questionId,
          cellReference: mapping.cellReference,
          value: write.value,
          sheetName: mapping.sheetName
        });
      } else {
        missingMappings.push(write.questionId);
      }
    }
    
    console.log(`🎯 Mapped ${cellWrites.length}/${writes.length} writes`);
    if (missingMappings.length > 0) {
      console.warn(`⚠️ Missing mappings for: ${missingMappings.join(', ')}`);
    }
    
    // 4. Excel cellák frissítése
    let writeResult;
    try {
      writeResult = await excelWriteService.batchUpdateCells(protocolBuffer, cellWrites);
      
      if (!writeResult.success) {
        throw new Error(`Excel write failed: ${writeResult.errors?.join(', ')}`);
      }
      
      console.log(`✅ Successfully updated ${writeResult.modifiedCells} cells`);
      
    } catch (writeError) {
      console.error('❌ Excel write error:', writeError);
      return res.status(500).json({
        success: false,
        error: 'Excel írási hiba',
        details: String(writeError)
      });
    }
    
    // 5. Frissített protokoll feltöltése verziózott névvel
    let protocolUrl;
    try {
      const timestamp = Date.now();
      const versionedPath = `otis-protocols/${protocolId}/protocol_v${timestamp}.xlsx`;
      
      // ArrayBuffer -> Buffer konverzió és temp fájl
      const fs = await import('fs/promises');
      const buffer = Buffer.from(writeResult.buffer!);
      const tempPath = `/tmp/protocol-updated-${timestamp}.xlsx`;
      await fs.writeFile(tempPath, buffer);
      
      // Feltöltés és URL lekérés
      protocolUrl = await supabaseStorage.uploadFile(tempPath, versionedPath);
      
      console.log(`💾 Uploaded versioned protocol: ${versionedPath}`);
      
    } catch (uploadError) {
      console.error('❌ Protocol upload error:', uploadError);
      return res.status(500).json({
        success: false,
        error: 'Frissített protokoll mentése sikertelen',
        details: String(uploadError)
      });
    }
    
    // 6. Sikeres válasz
    res.json({
      success: true,
      modifiedCells: writeResult.modifiedCells,
      totalRequested: writes.length,
      protocolUrl,
      missingMappings: missingMappings.length > 0 ? missingMappings : undefined,
      errors: writeResult.errors
    });
    
    console.log(`✅ Protocol mapping write completed successfully`);
    
  } catch (error) {
    console.error('❌ Protocol mapping write error:', error);
    res.status(500).json({
      success: false,
      error: 'Szerver hiba a protocol mapping során',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Template mapping lekérdezése egy adott protokollhoz
router.get('/:protocolId/mapping', async (req, res) => {
  try {
    const { protocolId } = req.params;
    
    // Template mapping betöltése (hardcoded fallback)
    const cellMappings = [
      { questionId: 'Q_NID_device1_biztositek', cellReference: 'B10' },
      { questionId: 'Q_NID_device1_kismegszakito', cellReference: 'C10' },
      { questionId: 'Q_NID_device1_fiIn', cellReference: 'D10' },
      { questionId: 'Q_NID_device1_fiDin', cellReference: 'E10' },
    ];
    
    res.json({
      success: true,
      protocolId,
      mappings: cellMappings
    });
    
  } catch (error) {
    console.error('❌ Get mapping error:', error);
    res.status(500).json({
      success: false,
      error: 'Template mapping lekérdezése sikertelen',
      details: String(error)
    });
  }
});

export { router as protocolMappingRoutes };