import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import express from "express";
import path from "path";
import * as fs from "fs";

import { storage } from "./storage.js";
import { testConnection } from "./db.js";
import { insertProtocolSchema } from "../shared/schema.js";
import { excelService } from "./services/excel-service.js";
import { pdfService } from "./services/pdf-service.js";
import { emailService } from "./services/email-service.js";
import { excelParserService } from "./services/excel-parser.js";
import { errorRoutes } from "./routes/error-routes.js";
import { supabaseStorage } from "./services/supabase-storage.js";
import { niedervoltService } from "./services/niedervolt-service.js";
import { hybridTemplateLoader } from "./services/hybrid-template-loader.js";
import { protocolMappingRoutes } from "./routes/protocol-mapping.js";
// Gyorsítótár a kérdések tárolására
let questionsCache: any[] | null = null;

// Helper function for dynamic question filtering
function filterQuestionsByConditions(questions: any[], truthyConditions: string[]): any[] {
  return questions.filter(question => {
    // If no conditional group key is set, always include the question
    if (!question.conditionalGroupKey && !question.conditional_group_key) {
      return true;
    }
    
    // Include question only if its conditional group key is in the truthy conditions
    // Support both camelCase (from parser) and snake_case (from schema)
    const conditionalKey = question.conditionalGroupKey || question.conditional_group_key;
    return truthyConditions.includes(conditionalKey);
  });
}

// Feltöltési mappa
const uploadDir = process.env.NODE_ENV === 'production'
  ? '/tmp'
  : path.join(process.cwd(), 'uploads');

if (process.env.NODE_ENV !== 'production' && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  await testConnection();

  // ✅ Frontend dist kiszolgálása
  app.use(express.static(path.join(process.cwd(), "dist")));

  // ✅ Root/public kiszolgálása (pl. otis-logo.png)
  app.use(express.static(path.join(process.cwd(), "public")));

  // Error routes
  app.use("/api/errors", errorRoutes);
  
  // Protocol mapping routes
  app.use("/api/protocols", protocolMappingRoutes);
  
  // Cache management route
  app.post("/api/admin/cache/clear", (req, res) => {
    questionsCache = null;
    console.log("✅ Questions cache cleared");
    res.json({ success: true, message: "Cache cleared" });
  });

  // Protocol létrehozása
  app.post("/api/protocols", async (req, res) => {
    try {
      const protocolData = insertProtocolSchema.parse(req.body);
      const protocol = await storage.createProtocol(protocolData);
      res.json(protocol);
    } catch (error) {
      console.error("Error creating protocol:", error);
      res.status(400).json({ message: "Invalid protocol data" });
    }
  });

  // Health check for Docker
  app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

  // Excel letöltési végpont
  app.post("/api/protocols/download-excel", async (req, res) => {
    try {
      console.log("Excel download request received");
      const { formData, language } = req.body;
      
      if (!formData) {
        return res.status(400).json({ message: "Form data is required" });
      }
      
      const { simpleXmlExcelService } = await import('./services/simple-xml-excel.js');
      
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

  // --- JAVÍTÁS: ÚJ PDF LETÖLTÉSI VÉGPONT HOZZÁADVA ---
  app.post("/api/protocols/download-pdf", async (req, res) => {
    try {
      console.log("PDF download request received");
      const { formData, language } = req.body;
      if (!formData) return res.status(400).json({ message: "Form data is required" });

      // 1. Először legeneráljuk az Excel fájlt ugyanazzal a logikával
      const { simpleXmlExcelService } = await import('./services/simple-xml-excel.js');
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

  // --- NEW GROUNDING PDF ENDPOINT ---
  app.post("/api/protocols/download-grounding-pdf", async (req, res) => {
    try {
      console.log("Grounding PDF download request received");
      const { formData, language } = req.body;
      if (!formData) return res.status(400).json({ message: "Form data is required" });

      // 1. Generate Excel with grounding-specific data using the specialized service
      const { groundingExcelService } = await import('./services/grounding-excel-service.js');
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

  // server/routes.ts

// Kérdések lekérése - GYORSÍTÓTÁRAZOTT VERZIÓ
app.get("/api/questions/:language", async (req, res) => {
  try {
    const { language } = req.params;
    if (language !== "hu" && language !== "de") {
      return res.status(400).json({ message: "Invalid language specified" });
    }

    // 1. LÉPÉS: Ellenőrizzük a gyorsítótárat
    if (questionsCache) {
      console.log('✅ Serving questions from cache');
    } else {
      // 2. LÉPÉS: Ha a cache üres, betöltjük a hibrid template loader-rel
      console.log('ℹ️ Cache is empty, loading template with hybrid loader...');
      
      // Próbáljuk megszerezni az aktív template ID-t
      const activeTemplate = await storage.getActiveTemplate("unified", "multilingual");
      const templateId = activeTemplate?.id || 'alap_egysegu'; // Fallback helyi template
      
      // Hibrid betöltés: Helyi -> Cache -> Supabase
      const templateResult = await hybridTemplateLoader.loadTemplate(
        templateId, 
        "unified", 
        "multilingual"
      );
      
      console.log(`📋 Template loaded from: ${templateResult.loadedFrom} (${templateResult.templateInfo.name || templateResult.templateInfo.file_name})`);
      
      const questions = await excelParserService.parseQuestionsFromExcel(templateResult.filePath);
      console.log(`✅ Parsed ${questions.length} questions.`);
      
      // 3. LÉPÉS: Elmentjük a feldolgozott kérdéseket a cache-be
      questionsCache = questions;
    }

    // 4. LÉPÉS: A cache-ből formázzuk és küldjük a választ
    const formattedQuestions = questionsCache.map((config) => {
      let groupName =
        language === "de" && config.groupNameDe
          ? config.groupNameDe
          : config.groupName;
      const typeStr = config.type as string;
      if (typeStr === "measurement" || typeStr === "calculated") {
        groupName = language === "de" ? "Messdaten" : "Mérési adatok";
      }

      let correctedType = config.type;
      if (config.type === 'checkbox' && config.placeholder === 'Válasszon') {
          correctedType = 'radio';
      }

      return {
        id: config.questionId,
        title:
          language === "hu"
            ? config.titleHu || config.title
            : config.titleDe || config.title,
        conditional_group_key: config.conditionalGroupKey, // Normalize to snake_case for frontend consistency
        type: correctedType,
        required: config.required,
        placeholder: config.placeholder ?? undefined,
        cellReference: config.cellReference ?? undefined,
        sheetName: config.sheetName ?? undefined,
        groupName: groupName ?? undefined,
        groupOrder: config.groupOrder ?? 0,
        unit: config.unit ?? undefined,
        minValue: config.minValue ?? undefined,
        maxValue: config.maxValue ?? undefined,
        calculationFormula: config.calculationFormula ?? undefined,
        calculationInputs: config.calculationInputs ?? undefined,
      };
    });

    res.json(formattedQuestions);
  } catch (error) {
    console.error("❌ Error fetching questions:", error);
    // Hiba esetén töröljük a cache-t, hogy a következő kérés újra próbálkozzon
    questionsCache = null;
    res.status(500).json({ message: "Failed to fetch questions" });
  }
});

// Filtered questions endpoint for dynamic question display
app.post("/api/questions/filter", async (req, res) => {
  try {
    const { language, conditions } = req.body;
    
    if (language !== "hu" && language !== "de") {
      return res.status(400).json({ message: "Invalid language specified" });
    }
    
    if (!Array.isArray(conditions)) {
      return res.status(400).json({ message: "Conditions must be an array of strings" });
    }

    // Use the same hybrid loading logic for filtering
    if (!questionsCache) {
      console.log('ℹ️ Cache is empty, loading template with hybrid loader for filtering...');
      
      const activeTemplate = await storage.getActiveTemplate("unified", "multilingual");
      const templateId = activeTemplate?.id || 'alap_egysegu';
      
      const templateResult = await hybridTemplateLoader.loadTemplate(
        templateId, 
        "unified", 
        "multilingual"
      );
      
      const questions = await excelParserService.parseQuestionsFromExcel(templateResult.filePath);
      questionsCache = questions;
    }

    // Format questions similarly to the main endpoint
    const allFormattedQuestions = questionsCache.map((config) => {
      let groupName =
        language === "de" && config.groupNameDe
          ? config.groupNameDe
          : config.groupName;
      const typeStr = config.type as string;
      if (typeStr === "measurement" || typeStr === "calculated") {
        groupName = language === "de" ? "Messdaten" : "Mérési adatok";
      }

      let correctedType = config.type;
      if (config.type === 'checkbox' && config.placeholder === 'Válasszon') {
          correctedType = 'radio';
      }

      return {
        id: config.questionId,
        title:
          language === "hu"
            ? config.titleHu || config.title
            : config.titleDe || config.title,
        conditional_group_key: config.conditionalGroupKey, // Normalize to snake_case
        type: correctedType,
        required: config.required,
        placeholder: config.placeholder ?? undefined,
        cellReference: config.cellReference ?? undefined,
        sheetName: config.sheetName,
        multiCell: config.multiCell,
        groupName,
        groupOrder: config.groupOrder || 0,
        unit: config.unit,
        minValue: config.minValue,
        maxValue: config.maxValue,
        calculationFormula: config.calculationFormula,
        calculationInputs: config.calculationInputs,
      };
    });

    // Apply conditional filtering
    const filteredQuestions = filterQuestionsByConditions(allFormattedQuestions, conditions);
    
    console.log(`🎯 Filtered ${filteredQuestions.length} questions from ${allFormattedQuestions.length} total questions based on ${conditions.length} conditions`);
    
    res.json(filteredQuestions);

  } catch (error) {
    console.error("❌ Error fetching filtered questions:", error);
    res.status(500).json({ message: "Failed to fetch filtered questions" });
  }
});

  // ====================================================================
  // === MÓDOSÍTOTT RÉSZ KEZDETE ===
  // ====================================================================
  // Niedervolt eszközök lekérése - JAVÍTOTT VERZIÓ
  app.get("/api/niedervolt/devices", async (req, res) => {
    try {
      console.log('📋 Fetching niedervolt devices (hardcoded mode)');
      
      const devices = await niedervoltService.getNiedervoltDevices();
      const dropdownOptions = niedervoltService.getDropdownOptions();
      
      console.log(`✅ Returned ${devices.length} niedervolt devices successfully`);
      
      res.json({
        devices,
        dropdownOptions
      });
      
    } catch (error) {
      console.error("❌ Error fetching niedervolt devices:", error);
      
      // Emergency fallback - ha a hardcoded logika valamiért mégis hibát dobna
      console.log('🚨 Using emergency fallback devices due to an unexpected error');
      
      res.status(500).json({
        devices: [
          {
            id: "emergency-device-1",
            name: {
              de: "Antriebsmotor (Fallback)",
              hu: "Motor (Tartalék)"
            }
          }
        ],
        dropdownOptions: niedervoltService.getDropdownOptions() // Próbáljuk meg az alap opciókat visszaadni
      });
    }
  });
  // ====================================================================
  // === MÓDOSÍTOTT RÉSZ VÉGE ===
  // ====================================================================

  // ====================================================================
  // === HIBRID TEMPLATE KEZELÉS API ===
  // ====================================================================
  
  // Elérhető template-ek listázása (helyi + remote)
  app.get("/api/admin/templates/available", async (req, res) => {
    try {
      console.log('📋 Fetching all available templates (local + remote)');
      
      const allTemplates = await hybridTemplateLoader.getAllAvailableTemplates();
      
      const response = {
        local: allTemplates.local,
        remote: allTemplates.remote,
        current: {
          templateId: 'alap_egysegu', // TODO: localStorage-ből olvasni
          loadStrategy: 'local_first'
        }
      };
      
      console.log(`✅ Found ${allTemplates.local.length} local and ${allTemplates.remote.length} remote templates`);
      res.json(response);
      
    } catch (error) {
      console.error("❌ Error fetching available templates:", error);
      res.status(500).json({ message: "Failed to fetch available templates" });
    }
  });

  // Template választás beállítása
  app.post("/api/admin/templates/select", async (req, res) => {
    try {
      const { templateId, loadStrategy } = req.body;
      
      if (!templateId) {
        return res.status(400).json({ message: "Template ID is required" });
      }
      
      console.log(`🔄 Selecting template: ${templateId} with strategy: ${loadStrategy || 'local_first'}`);
      
      // Teszteljük, hogy betölthető-e a template
      const templateResult = await hybridTemplateLoader.loadTemplate(
        templateId, 
        "unified", 
        "multilingual"
      );
      
      // Cache törlése, hogy újra betöltse az új template-et
      questionsCache = null;
      
      console.log(`✅ Template selected successfully: ${templateResult.templateInfo.name || templateResult.templateInfo.file_name}`);
      console.log(`📋 Loaded from: ${templateResult.loadedFrom}`);
      
      res.json({
        success: true,
        template: {
          id: templateId,
          name: templateResult.templateInfo.name || templateResult.templateInfo.file_name,
          loadedFrom: templateResult.loadedFrom,
          isLocal: templateResult.isLocal
        }
      });
      
    } catch (error) {
      console.error("❌ Error selecting template:", error);
      res.status(500).json({ message: "Failed to select template" });
    }
  });

  // Admin: Sablonok listázása
  app.get("/api/admin/templates", async (_req, res) => {
    try {
      const templates = await storage.getAllTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  // Admin: Feltöltés
  app.post("/api/admin/templates/upload", upload.single("file"), async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { name, type, language } = req.body;
      if (!name || !type || !language) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: "Missing required fields" });
      }

      const storagePath = `templates/${Date.now()}-${req.file.originalname}`;
      await supabaseStorage.uploadFile(req.file.path, storagePath);
      
      const newTemplate = await storage.createTemplate({
        name,
        type,
        language,
        file_name: req.file.originalname,
        file_path: storagePath,
        is_active: false,
      });
      
      if (type === 'questions' || type === 'unified') {
        try {
          console.log(`✅ Template created, now parsing questions from: ${req.file.path}`);
          const questions = await excelParserService.parseQuestionsFromExcel(req.file.path);
          
          console.log(`✅ Parsed ${questions.length} questions from template.`);
          
          const parseOptionalInt = (value: any): number | null => {
            if (value === null || value === undefined || value === '') return null;
            const num = parseInt(String(value), 10);
            return isNaN(num) ? null : num;
          };

          for (const q of questions) {
            await storage.createQuestionConfig({
              template_id: newTemplate.id,
              question_id: q.questionId,
              title: q.title,
              title_hu: q.titleHu,
              title_de: q.titleDe,
              type: q.type,
              required: q.required,
              placeholder: q.placeholder,
              cell_reference: q.cellReference,
              sheet_name: q.sheetName,
              multi_cell: q.multiCell,
              group_name: q.groupName,
              group_name_de: q.groupNameDe,
              group_order: parseOptionalInt(q.groupOrder) ?? 0,
              unit: q.unit,
              min_value: parseOptionalInt(q.minValue),
              max_value: parseOptionalInt(q.maxValue),
              calculation_formula: q.calculationFormula,
              calculation_inputs: q.calculationInputs,
            });
          }
          console.log(`✅ Successfully saved ${questions.length} question configs to the database.`);

        } catch (parseError) {
          console.error("Error parsing questions from uploaded template:", parseError);
        }
      }

      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

      res.json({ success: true, path: storagePath, template: newTemplate });
    } catch (error) {
      console.error("Error uploading template:", error);
      res.status(500).json({ message: "Failed to upload template" });
    }
  });

  // Admin: Aktiválás
  app.post("/api/admin/templates/:id/activate", async (req, res) => {
    try {
      await storage.setActiveTemplate(req.params.id);
      
      // ✅ JAVÍTÁS: Cache törlése az aktiválás után
      questionsCache = null;
      console.log("✅ Questions cache cleared after template activation");
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error activating template:", error);
      res.status(500).json({ message: "Failed to activate template" });
    }
  });

  // Admin: Törlés
  app.delete("/api/admin/templates/:id", async (req, res) => {
    try {
      const templateId = req.params.id;
      const template = await storage.getTemplate(templateId);

      // ======================= JAVÍTÁS ITT =======================
      // Először töröljük a kapcsolódó kérdéseket, hogy elkerüljük az adatbázis hibát.
      await storage.deleteQuestionConfigsByTemplate(templateId);
      console.log(`✅ Deleted question configs for template: ${templateId}`);

      // Fájl törlése Supabase-ből multi-tier stratégiával
      if (template?.file_path) {
        try {
          const { executeWithFilenameStrategies } = await import('./utils/filename-corrections.js');
          
          console.log(`🗑️ Attempting to delete file from Supabase: ${template.file_path}`);
          await executeWithFilenameStrategies(
            template.file_path,
            (path) => supabaseStorage.deleteFile(path),
            'delete'
          );
          
        } catch (error: any) {
          console.warn(`⚠️ Could not delete file from storage. Continuing with database cleanup. Error:`, error?.message);
          // Ne blokkoljuk a törlést, ha a fájl törlése nem sikerül
        }
      }
      
      // Csak ezután töröljük magát a sablont.
      await storage.deleteTemplate(templateId);
      console.log(`✅ Deleted template record: ${templateId}`);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // --- IDE KERÜLT AZ ÚJ LETÖLTÉSI VÉGPONT ---
  // Debug: Supabase storage tartalom megjelenítése
  app.get("/api/admin/debug/storage", async (req, res) => {
    try {
      console.log(`🔍 Debugging Supabase storage contents...`);
      
      // Próbáljuk meg listázni a templates mappát
      const { supabaseStorage } = await import('./services/supabase-storage.js');
      const bucketName = process.env.SUPABASE_BUCKET || 'aprod-templates';
      
      // Egyszerűsített debug - csak a template fájlok listázása  
      console.log(`📁 Debug: checking storage bucket: ${bucketName}`);
      
      // Próbáljuk meg ellenőrizni, hogy van-e hozzáférésünk
      const debugInfo = {
        bucket: bucketName,
        message: "Storage debug endpoint is working",
        environment: {
          VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? "SET" : "NOT SET",
          SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? "SET" : "NOT SET", 
          SUPABASE_BUCKET: process.env.SUPABASE_BUCKET ? "SET" : "NOT SET"
        }
      };

      res.json({
        success: true,
        debug: debugInfo
      });

    } catch (error: any) {
      console.error("Error debugging storage:", error);
      res.status(500).json({ message: "Failed to debug storage", error: error?.message || 'Unknown error' });
    }
  });

  // Admin: Sablon letöltése
  app.get("/api/admin/templates/:id/download", async (req, res) => {
    try {
      const templateId = req.params.id;
      
      // 1. Sablon adatainak lekérése az adatbázisból, hogy megkapjuk a fájl elérési útját
      const template = await storage.getTemplate(templateId);
      if (!template || !template.file_path || !template.file_name) {
        return res.status(404).json({ message: "Template file not found in database." });
      }

      let storagePath = template.file_path;
      let originalFileName = template.file_name;
      
      // Fix karakterkódolási problémák
      const fixCorruptedString = (str: string): string => {
        // Javítás: KÃÂ©rdÃÂ©ssor -> Kérdéssor
        return str
          .replace(/KÃÂ©rdÃÂ©ssor/g, 'Kérdéssor')
          .replace(/KÃ¢â‚¬Â/g, 'é')
          .replace(/KÃÂ/g, 'K')
          .replace(/Ã©/g, 'é')
          .replace(/Ã¡/g, 'á')
          .replace(/Ã­/g, 'í')
          .replace(/Ã³/g, 'ó')
          .replace(/Ã¶/g, 'ö')
          .replace(/Ã¼/g, 'ü')
          .replace(/Ã¸/g, 'ő')
          .replace(/Ã¤/g, 'ä');
      };
      
      // Próbáljunk meg javítani a fájlnevet
      const originalStoragePath = storagePath;
      const originalOriginalFileName = originalFileName;
      
      console.log(`📁 Original storage path: ${originalStoragePath}`);
      console.log(`📁 Original file name: ${originalOriginalFileName}`);
      
      const tempLocalPath = path.join(uploadDir, `download-${Date.now()}-${originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`);

      // 2. Fájl letöltése a Supabase Storage-ból egy ideiglenes helyi mappába
      console.log(`Downloading template from Supabase: ${storagePath} to ${tempLocalPath}`);
      
      // Többféle letöltési stratégia próbálása
      const downloadStrategies = [
        // 1. Eredeti fájlnév
        { path: originalStoragePath, description: "original path" },
        // 2. URL encoded verzió
        { path: originalStoragePath.split('/').map((part: string) => encodeURIComponent(part)).join('/'), description: "URL encoded path" },
        // 3. Karakterkódolás javítása
        { path: fixCorruptedString(originalStoragePath), description: "character-fixed path" },
        // 4. Dupla encoding javítás
        { path: originalStoragePath.replace(/KÃÂ©rdÃÂ©ssor/g, 'Kerdessor'), description: "ASCII-safe path" },
        // 5. Csak ASCII karakterek
        { path: originalStoragePath.replace(/[^\x00-\x7F]/g, ""), description: "ASCII-only path" }
      ];

      let downloadSuccess = false;
      let lastError: any = null;

      for (const strategy of downloadStrategies) {
        try {
          console.log(`🔄 Trying download strategy: ${strategy.description}`);
          console.log(`📁 Path: ${strategy.path}`);
          
          await supabaseStorage.downloadFile(strategy.path, tempLocalPath);
          console.log(`✅ Download successful with strategy: ${strategy.description}`);
          downloadSuccess = true;
          break;
        } catch (error: any) {
          console.log(`❌ Strategy "${strategy.description}" failed:`, error?.message || error);
          lastError = error;
          continue;
        }
      }

      if (!downloadSuccess) {
        console.error(`💥 ALL download strategies failed. Last error:`, lastError);
        throw new Error(`Unable to download template file using any strategy. Last error: ${lastError?.message || 'Unknown error'}`);
      }

      // 3. Fájl elküldése a felhasználónak, majd az ideiglenes fájl törlése
      res.download(tempLocalPath, originalFileName, (err) => {
        if (err) {
          console.error("Error sending file to client:", err);
        }
        
        // Töröljük az ideiglenes fájlt a letöltés után
        if (fs.existsSync(tempLocalPath)) {
          fs.unlinkSync(tempLocalPath);
          console.log(`✅ Cleaned up temporary file: ${tempLocalPath}`);
        }
      });

    } catch (error) {
      console.error("Error downloading template:", error);
      res.status(500).json({ message: "Failed to download template" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}