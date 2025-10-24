import express from 'express';
import multer from 'multer';
import path from 'path';
import * as fs from 'fs';
import { storage } from '../storage.js';
import { supabaseStorage } from '../services/supabase-storage.js';
import { excelParserService } from '../services/excel-parser.js';
import { hybridTemplateLoader } from '../services/hybrid-template-loader.js';
import { clearQuestionsCache } from '../routes.js';

const router = express.Router();

const uploadDir = process.env.NODE_ENV === 'production' ? '/tmp' : path.join(process.cwd(), 'uploads');
if (process.env.NODE_ENV !== 'production' && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

// GET /api/admin/templates/available - Helyi és távoli sablonok listázása
router.get("/templates/available", async (_req, res) => {
  try {
    const allTemplates = await hybridTemplateLoader.getAllAvailableTemplates();
    const activeTemplate = await storage.getActiveTemplate('unified', 'multilingual');
    res.json({
      ...allTemplates,
      current: {
        templateId: activeTemplate?.id,
      }
    });
  } catch (error) {
    console.error("Error fetching available templates:", error);
    res.status(500).json({ message: "Failed to fetch available templates" });
  }
});

// POST /api/admin/templates/select - Sablon kiválasztása
router.post("/templates/select", async (req, res) => {
  try {
    const { templateId, loadStrategy } = req.body;
    if (!templateId) {
      return res.status(400).json({ message: "Template ID is required" });
    }
    console.log(`📄 Selecting template: ${templateId} with strategy: ${loadStrategy || 'local_first'}`);

    const templateResult = await hybridTemplateLoader.loadTemplate(
      templateId,
      "unified",
      "multilingual"
    );

    console.log(`✅ Template selection processed for: ${templateResult.templateInfo.name || templateResult.templateInfo.file_name}`);
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error selecting template:", error);
    res.status(500).json({ message: "Failed to select template" });
  }
});

// GET /api/admin/templates - Feltöltött (adatbázisban lévő) sablonok listázása
router.get("/templates", async (_req, res) => {
  try {
    const templates = await storage.getAllTemplates();
    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ message: "Failed to fetch templates" });
  }
});

// =========================================================
// === VISSZAÁLLÍTOTT FUNKCIÓ: TEMPLATE FÁJL LETÖLTÉSE ===
// =========================================================
router.get("/templates/:id/download", async (req, res) => {
  try {
    const templateId = req.params.id;
    console.log(`[DOWNLOAD] Request received for template ID: ${templateId}`);

    // 1. Lekérjük a sablon adatait az adatbázisból az ID alapján
    const template = await storage.getTemplate(templateId);

    if (!template) {
      console.error(`[DOWNLOAD] Error: Template not found with ID: ${templateId}`);
      return res.status(404).json({ message: "Template not found" });
    }

    // 2. Ellenőrizzük, hogy van-e fájl útvonal megadva
    const filePath = template.file_path;
    if (!filePath) {
      console.error('[DOWNLOAD] Error: file_path is missing for this template.');
      return res.status(500).json({ message: 'File path is missing for this template.' });
    }

    // 3. Letöltjük a fájlt a Supabase Storage-ból
    // Mivel a `downloadFile` helyi fájlba ment, létrehozunk egy temp útvonalat
    const tempLocalPath = path.join(uploadDir, `download-${Date.now()}-${template.file_name}`);
    
    console.log(`[DOWNLOAD] Attempting to download from storage path: ${filePath} to ${tempLocalPath}`);
    await supabaseStorage.downloadFile(filePath, tempLocalPath);
    console.log(`[DOWNLOAD] File downloaded successfully to temp path.`);

    // 4. Az Express `res.download` funkciójával elküldjük a fájlt, ami a küldés után törli is azt
    res.download(tempLocalPath, template.file_name, (err) => {
      if (err) {
        console.error("Error sending file to client:", err);
      }
      
      // A callback biztosítja, hogy a fájl törlése a küldés után történjen
      fs.unlink(tempLocalPath, (unlinkErr) => {
        if (unlinkErr) console.error("Error deleting temp file:", unlinkErr);
        else console.log(`✅ Cleaned up temporary file: ${tempLocalPath}`);
      });
    });

  } catch (error) {
    console.error("❌ Error during template download:", error);
    res.status(500).json({ message: "Failed to download template file." });
  }
});

// POST /api/admin/templates/upload - Új sablon feltöltése
router.post("/templates/upload", upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const { originalname, path: tempPath } = req.file;
    const { name, type, language } = req.body;

    if (!type) {
      return res.status(400).json({ message: "Template 'type' ('unified' or 'protocol') is required." });
    }

    const storagePath = `templates/${Date.now()}-${originalname}`;
    await supabaseStorage.uploadFile(tempPath, storagePath);
    console.log(`[Upload] File uploaded to Supabase at: ${storagePath}`);

    const templateType = type;

    const newTemplate = await storage.createTemplate({
      name: name || originalname,
      type: templateType,
      language: language || 'multilingual',
      file_name: originalname,
      file_path: storagePath,
    });
    console.log(`[Upload] DB entry created for template ID: ${newTemplate.id}`);

    if (templateType === 'unified' || templateType === 'questions') {
      console.log(`Parsing questions for template of type "${templateType}"...`);
      const questions = await excelParserService.parseQuestionsFromExcel(tempPath);
      console.log(`✅ Parsed ${questions.length} questions from template.`);

      for (const q of questions) {
        if (!q.questionId) {
          console.warn("Skipping question due to missing questionId:", q);
          continue;
        }

        await storage.createQuestionConfig({
          ...q,
          template_id: newTemplate.id,
          question_id: q.questionId,
          cell_reference: q.cellReference ?? null,
        });
      }
    } else {
      console.log(`Skipping question parsing for template of type "${templateType}".`);
    }

    res.status(201).json({ success: true, template: newTemplate });

  } catch (error) {
    console.error("❌ Error uploading template:", error);
    res.status(500).json({ message: "Failed to upload template." });
  } finally {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }
  }
});

// POST /api/admin/templates/:id/activate - Sablon aktiválása
router.post("/templates/:id/activate", async (req, res) => {
  try {
    await storage.setActiveTemplate(req.params.id);

    hybridTemplateLoader.clearCache();
    console.log('✅ Template cache cleared after activation.');
    clearQuestionsCache();
    res.json({ success: true });
  } catch (error) {
    console.error("Error activating template:", error);
    res.status(500).json({ message: "Failed to activate template" });
  }
});

// DELETE /api/admin/templates/:id - Sablon törlése
router.delete("/templates/:id", async (req, res) => {
  try {
    const templateId = req.params.id;
    const template = await storage.getTemplate(templateId);

    await storage.deleteQuestionConfigsByTemplate(templateId);

    if (template?.file_path) {
      await supabaseStorage.deleteFile(template.file_path);
    }

    await storage.deleteTemplate(templateId);

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({ message: "Failed to delete template" });
  }
});

export const adminRoutes = router;