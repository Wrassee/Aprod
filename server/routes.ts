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

  // Kérdések lekérése
  app.get("/api/questions/:language", async (req, res) => {
    try {
      const { language } = req.params;
      if (language !== "hu" && language !== "de") {
        return res.status(400).json({ message: "Invalid language specified" });
      }

      const questionsTemplate = await storage.getActiveTemplate("unified", "multilingual");

      if (!questionsTemplate || !questionsTemplate.file_path) {
        return res.status(404).json({ message: "No active questions template found" });
      }

      const storagePath = questionsTemplate.file_path;
      const tempPath = path.join("/tmp", `template-${Date.now()}-${questionsTemplate.file_name}`);

      await supabaseStorage.downloadFile(storagePath, tempPath);
      console.log(`✅ Template downloaded to ${tempPath}`);

      const questions = await excelParserService.parseQuestionsFromExcel(tempPath);
      console.log(`✅ Parsed ${questions.length} questions.`);

      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }

      const formattedQuestions = questions.map((config) => {
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
            console.log(`🔧 Correcting type for question ID: ${config.questionId} from 'checkbox' to 'radio'`);
        }

        return {
          id: config.questionId,
          title:
            language === "hu"
              ? config.titleHu || config.title
              : config.titleDe || config.title,
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
      res.status(500).json({ message: "Failed to fetch questions" });
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

      if (template?.file_path) {
        await supabaseStorage.deleteFile(template.file_path);
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
  // Admin: Sablon letöltése
  app.get("/api/admin/templates/:id/download", async (req, res) => {
    try {
      const templateId = req.params.id;
      
      // 1. Sablon adatainak lekérése az adatbázisból, hogy megkapjuk a fájl elérési útját
      const template = await storage.getTemplate(templateId);
      if (!template || !template.file_path || !template.file_name) {
        return res.status(404).json({ message: "Template file not found in database." });
      }

      const storagePath = template.file_path;
      const originalFileName = template.file_name;
      const tempLocalPath = path.join(uploadDir, `download-${Date.now()}-${originalFileName}`);

      // 2. Fájl letöltése a Supabase Storage-ból egy ideiglenes helyi mappába
      console.log(`Downloading template from Supabase: ${storagePath} to ${tempLocalPath}`);
      await supabaseStorage.downloadFile(storagePath, tempLocalPath);
      console.log(`✅ Template successfully downloaded to temporary path.`);

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