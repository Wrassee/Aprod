// server/routes/protocol-mapping.ts - JAVÍTOTT NYELV ÁTADÁS (Földelési PDF)

import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { supabaseStorage } from '../services/supabase-storage.js';
import { storage } from '../storage.js';
import { insertProtocolSchema } from '../../shared/schema.js';
import { pdfService } from '../services/pdf-service.js';
import { GroundingPdfService } from '../services/grounding-pdf-service.js';
import { requireAuth } from '../middleware/auth.js';
import { emailService } from '../services/email-service.js';

const router = Router();
const upload = multer();

// =========================================================
// === PROTOKOLLOK LISTÁZÁSA (USER SZÁMÁRA)
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

    const { items, total } = await storage.getProtocols({
      userId: authenticatedUser.id,
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

// =========================================================
// === PROTOKOLL LÉTREHOZÁSA
// =========================================================
router.post('/', requireAuth, async (req, res) => {
  try {
    const protocolData = insertProtocolSchema.parse(req.body);
    const authenticatedUser = (req as any).user;

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

// =========================================================
// === PROTOKOLL TÖRLÉSE (USER SZÁMÁRA)
// =========================================================
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const authenticatedUser = (req as any).user;
    const { id } = req.params;

    console.log(`Server: Deleting protocol ${id} for USER: ${authenticatedUser.id}`);

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

// =========================================================
// === EXCEL LETÖLTÉS
// =========================================================
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

// =========================================================
// === PDF ELŐNÉZET (ÚJ VÉGPONT) - INLINE MEGJELENÍTÉS
// =========================================================
router.post('/preview-pdf', async (req, res) => {
  try {
    console.log("PDF preview request received");
    const { formData, language } = req.body;
    if (!formData) return res.status(400).json({ message: "Form data is required" });

    // 1. Excel generálás
    const { simpleXmlExcelService } = await import('../services/simple-xml-excel.js');
    const excelBuffer = await simpleXmlExcelService.generateExcelFromTemplate(formData, language || 'hu');

    // 2. PDF generálás az Excel bufferből
    console.log("Generating PDF from Excel buffer for preview...");
    const pdfBuffer = await pdfService.generatePDF(excelBuffer);

    const liftId = formData.answers?.['7'] ? String(formData.answers['7']).replace(/[^a-zA-Z0-9]/g, '_') : 'Unknown';
    const filename = `OTIS_Protocol_PREVIEW_${liftId}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    console.log(`PDF preview generated: ${filename} (${pdfBuffer.length} bytes)`);

    res.setHeader('Content-Type', 'application/pdf');
    
    // !!! EZ A KÜLÖNBSÉG !!!
    // "attachment" helyett "inline"-t használunk, így a böngésző megjeleníti a PDF-et
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    res.send(pdfBuffer);

  } catch (error) {
    console.error("Error generating PDF preview:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    res.status(500).json({ message: "Failed to generate PDF preview", error: errorMessage });
  }
});

// =========================================================
// === PDF LETÖLTÉS (MEGLÉVŐ VÉGPONT)
// =========================================================
router.post('/download-pdf', async (req, res) => {
  try {
    console.log("PDF download request received");
    const { formData, language } = req.body;
    if (!formData) return res.status(400).json({ message: "Form data is required" });

    // 1. Excel generálás
    const { simpleXmlExcelService } = await import('../services/simple-xml-excel.js');
    const excelBuffer = await simpleXmlExcelService.generateExcelFromTemplate(formData, language || 'hu');

    // 2. PDF generálás az Excel bufferből
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
// === FÖLDELÉSI PDF LETÖLTÉS
// =========================================================
router.post(
  '/download-grounding-pdf',
  upload.none(),
  async (req, res) => {
    try {
      console.log('⚡️ Received request to generate grounding PDF...');

      const groundingCheckAnswersString = req.body.groundingCheckAnswers;
      const customTextsString = req.body.customTexts;
      const errorsString = req.body.errors;
      // 🔥 ÚJ: Nyelv kinyerése a kérésből (ha nincs megadva, alapértelmezett 'hu')
      const language = req.body.language || 'hu';

      if (!groundingCheckAnswersString) {
        return res.status(400).json({ 
          message: 'Hiányzó "groundingCheckAnswers" a kérésben.' 
        });
      }

      const groundingCheckAnswers = JSON.parse(groundingCheckAnswersString);
      const customGroundingTexts = customTextsString ? JSON.parse(customTextsString) : {};
      const errors = errorsString ? JSON.parse(errorsString) : [];
      
      console.log('📝 Custom texts received:', Object.keys(customGroundingTexts).length, 'entries');
      console.log('❗️ Errors received:', JSON.stringify(errors, null, 2));
      console.log('🌍 Language:', language); // Logoljuk a nyelvet

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
        errors: errors,
        answers: {}, 
        niedervoltMeasurements: [],
        niedervoltTableMeasurements: {},
      };
      
      // 🔥 ÚJ: A nyelv átadása a generáló service-nek
      const pdfBuffer = await GroundingPdfService.generateFilledPdf(servicePayload, language);

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

// =========================================================
// === EMAIL KÜLDÉS (A HIÁNYZÓ VÉGPONT)
// =========================================================
router.post('/email', requireAuth, async (req, res) => {
  try {
    console.log("📧 Email sending request received");

    // 1. Adatok kinyerése a kérésből (az App.tsx küldi)
    const { formData, language, recipient } = req.body;
    
    // 2. Hitelesített felhasználó adatainak kinyerése (a requireAuth middleware-ből)
    const authenticatedUser = (req as any).user;

    // Alapvető validáció
    if (!formData) {
      return res.status(400).json({ message: "Form data is required" });
    }
    if (!recipient || !recipient.includes('@')) {
      return res.status(400).json({ message: "Valid recipient email is required" });
    }

    // 3. Adatok kinyerése a formData-ból az email service számára
    const receptionDate = formData.receptionDate || new Date().toISOString().split('T')[0];
    const recipientEmail = recipient; // A frontend által megadott címzett

    // 4. Excel generálás (a többi PDF endpoint mintájára)
    // Megjegyzés: a simpleXmlExcelService importálása a függvényen belül van a többi route-nál is
    const { simpleXmlExcelService } = await import('../services/simple-xml-excel.js');
    const excelBuffer = await simpleXmlExcelService.generateExcelFromTemplate(formData, language || 'hu');
    
    // 5. PDF generálás az Excel bufferből
    console.log("Generating PDF from Excel buffer for email...");
    const pdfBuffer = await pdfService.generatePDF(excelBuffer);

    // 6. Opcionális: Hiba lista PDF generálása (ha van rá logika)
    // Jelenleg null-t adunk át, de az emailService képes kezelni.
    const errorListPdf = null; 
    
    // 7. Email küldése a service-en keresztül
    console.log(`Sending email for user ${recipientEmail}...`);
    await emailService.sendProtocolEmail({
      recipient: recipientEmail, // Ezt használja az interface
      language: language || 'hu',
      protocolPdf: pdfBuffer,
      errorListPdf: errorListPdf, 
      receptionDate: receptionDate
    });

    console.log("✅ Email sent successfully");
    res.status(200).json({ message: "Email sent successfully" });

  } catch (error) {
    console.error("❌ Error during email sending:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    res.status(500).json({ 
      message: "Failed to send email", 
      error: errorMessage 
    });
  }
});

export { router as protocolMappingRoutes };