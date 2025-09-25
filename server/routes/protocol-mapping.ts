// API routes for protocol-mapping functionality
import { Router } from 'express';
import { z } from 'zod';
import { excelWriteService } from '../../src/services/excelWriteService.js';
// import { mappingService } from '../../src/services/mappingService.js'; // ELTÁVOLÍTVA: kliens oldali service
import { supabaseStorage } from '../services/supabase-storage.js';
import { storage } from '../storage.js';

const router = Router();

// Request validation schema
const writeProtocolSchema = z.object({
  protocolId: z.string().min(1, 'Protocol ID kötelező'),
  writes: z.array(z.object({
    questionId: z.string().min(1, 'Question ID kötelező'),
    value: z.union([z.string(), z.number(), z.null()])
  })).min(1, 'Legalább egy írási művelet szükséges')
});

/**
 * POST /api/protocols/write-mapping
 * Niedervolt táblázat adatok írása az Otis protokollba
 */
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

/**
 * GET /api/protocols/:protocolId/mapping
 * Template mapping lekérdezése egy adott protokollhoz
 */
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