// server/routes/protocol-mapping.ts
import { Router } from 'express';
import multer from 'multer'; // ✅ ÚJ: FormData feldolgozáshoz
import { z } from 'zod';
import { supabaseStorage } from '../services/supabase-storage.js';
import { storage } from '../storage.js';
import { insertProtocolSchema } from '../../shared/schema.js';
import { pdfService } from '../services/pdf-service.js';
import { GroundingPdfService } from '../services/grounding-pdf-service.js';
import { requireAuth } from '../middleware/auth.js'; // ✅ 1. AUTH IMPORTÁLÁSA

const router = Router();
const upload = multer(); // ✅ Multer inicializálás FormData kezeléshez

// ✅ =========================================================
// === 6. HIBA JAVÍTÁSA: PROTOKOLLOK LISTÁZÁSA (USER SZÁMÁRA)
// === Ez kezeli a GET /api/protocols kérést (a protocol-list.tsx hívja)
// =========================================================
router.get('/', requireAuth, async (req, res) => {
  try {
    const authenticatedUser = (req as any).user;
    if (!authenticatedUser) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    console.log(`Server: Fetching protocols for USER: ${authenticatedUser.id} (Page: ${page}, Limit: ${limit})`);

    // Feltételezzük, hogy a `storage.getProtocols` létezik és kezeli a szűrést
    // Ha a `storage.ts`-ben nincs ilyen, ott is módosítani kell.
    const { items, total } = await storage.getProtocols({
      userId: authenticatedUser.id, // Csak a saját protokollok szűrése
      page,
      limit,
      offset
    });

    res.json({
      items: items || [],
      total: total || 0,
      currentPage: page,
      totalPages: Math.ceil((total || 0) / limit),
    });

  } catch (error) {
    console.error("Error fetching user protocols:", error);
    res.status(500).json({ message: "Failed to fetch protocols" });
  }
});

// PROTOKOLL LÉTREHOZÁSA
router.post('/', requireAuth, async (req, res) => { // ✅ 2. AUTH HOZZÁADVA
  try {
    const protocolData = insertProtocolSchema.parse(req.body);
    const authenticatedUser = (req as any).user;

    // Biztonsági ellenőrzés: A user_id-t mindig a hitelesített felhasználóra állítjuk
    const dataWithUser = {
      ...protocolData,
      user_id: authenticatedUser.user_id || authenticatedUser.id
    };

    const protocol = await storage.createProtocol(dataWithUser);
    res.json(protocol);
  } catch (error) {
    console.error("Error creating protocol:", error);
    res.status(400).json({ message: "Invalid protocol data" });
  }
});

// ✅ =========================================================
// === 6. HIBA JAVÍTÁSA: PROTOKOLL TÖRLÉSE (USER SZÁMÁRA)
// === Ez kezeli a DELETE /api/protocols/:id kérést (a protocol-list.tsx hívja)
// =========================================================
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const authenticatedUser = (req as any).user;
    const { id } = req.params;

    console.log(`Server: Deleting protocol ${id} for USER: ${authenticatedUser.id}`);

    // A `storage.deleteProtocol`-nak kell ellenőriznie, hogy az ID-hoz
    // tartozó `user_id` egyezik-e a `authenticatedUser.id`-vel.
    const success = await storage.deleteProtocol(id, authenticatedUser.id);

    if (!success) {
      return res.status(404).json({ message: "Protocol not found or user not authorized" });
    }

    res.status(200).json({ success: true, message: "Protocol deleted" });
  } catch (error) {
    console.error("Error deleting protocol:", error);
    res.status(500).json({ message: "Failed to delete protocol" });
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

// =========================================================
// === FÖLDELÉSI PDF LETÖLTÉS - VÉGLEGESEN JAVÍTOTT VERZIÓ ===
// =========================================================
router.post(
  '/download-grounding-pdf',
  upload.none(), // Multer middleware FormData feldolgozáshoz
  async (req, res) => {
    try {
      console.log('⚡️ Received request to generate grounding PDF...');

      // --- 1. LÉPÉS: A STRING-GÉ ALAKÍTOTT ADATOK FOGADÁSA ---
      const groundingCheckAnswersString = req.body.groundingCheckAnswers;
      const customTextsString = req.body.customTexts;
      const errorsString = req.body.errors; // ✅ HIÁNYZÓ LÉPÉS: A hibák string fogadása

      if (!groundingCheckAnswersString) {
        return res.status(400).json({ 
          message: 'Hiányzó "groundingCheckAnswers" a kérésben.' 
        });
      }

      // --- 2. LÉPÉS: A STRINGEK VISSZAALAKÍTÁSA OBJEKTUMOKKÁ (JSON.parse) ---
      const groundingCheckAnswers = JSON.parse(groundingCheckAnswersString);
      const customGroundingTexts = customTextsString ? JSON.parse(customTextsString) : {};
      const errors = errorsString ? JSON.parse(errorsString) : []; // ✅ HIÁNYZÓ LÉPÉS: A hibák visszaalakítása tömbbé
      
      console.log('📝 Custom texts received:', Object.keys(customGroundingTexts).length, 'entries');
      console.log('❗️ Errors received:', JSON.stringify(errors, null, 2));

      // --- 3. LÉPÉS: A PAYLOAD ÖSSZEÁLLÍTÁSA A HELYES, FELDOLGOZOTT ADATOKBÓL ---
      const servicePayload = {
        liftId: req.body.liftId || '',
        agency: req.body.agency || '',
        technicianName: req.body.technicianName || '',
        address: req.body.address || '',
        receptionDate: req.body.receptionDate || '',
        signerName: req.body.visum || '',
        visum: req.body.visum || '',
        signature: req.body.signature || '',
        groundingCheckAnswers: groundingCheckAnswers,
        customGroundingTexts: customGroundingTexts,
        
        // ✅ JAVÍTÁS: Itt már a feldolgozott `errors` tömböt használjuk!
        errors: errors, 

        // Kötelező, de üres mezők a típus-kompatibilitás miatt
        answers: {}, 
        niedervoltMeasurements: [],
        niedervoltTableMeasurements: {},
      };
      
      // 4. LÉPÉS: PDF generálás és küldés (változatlan)
      const pdfBuffer = await GroundingPdfService.generateFilledPdf(servicePayload);

      const safeFileName = servicePayload.liftId.replace(/[^a-zA-Z0-9]/g, '_') || 'jegyzokonyv';
      const filename = `Erdungskontrolle_${safeFileName}_${servicePayload.receptionDate || new Date().toISOString().split('T')[0]}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
      
      console.log('✅ Grounding PDF successfully generated and sent:', filename);

    } catch (error) {
      console.error('❌ Hiba a földelési PDF generálása közben:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ismeretlen hiba';
      res.status(500).json({ 
        message: 'Szerverhiba a PDF generálása közben.',
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  }
);

export { router as protocolMappingRoutes };

