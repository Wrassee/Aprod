import express from 'express';
import multer from 'multer';
import path from 'path';
import * as fs from 'fs';
import { storage } from '../storage.js';
import { supabaseStorage } from '../services/supabase-storage.js';
import { excelParserService } from '../services/excel-parser.js';
import { hybridTemplateLoader } from '../services/hybrid-template-loader.js';

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
    // JAVÍTVA: A válasz tartalmazza a jelenleg aktív sablon infóját is
    const activeTemplate = await storage.getActiveTemplate('unified', 'multilingual');
    res.json({
        ...allTemplates,
        current: {
            templateId: activeTemplate?.id,
            // Ide jöhetne a stratégia is, ha tárolnánk
        }
    });
  } catch (error) {
    console.error("Error fetching available templates:", error);
    res.status(500).json({ message: "Failed to fetch available templates" });
  }
});

// POST /api/admin/templates/select - Sablon kiválasztása (ez hiányzott)
router.post("/templates/select", async (req, res) => {
    try {
        const { templateId, loadStrategy } = req.body;
        if (!templateId) {
            return res.status(400).json({ message: "Template ID is required" });
        }
        console.log(`🔄 Selecting template: ${templateId} with strategy: ${loadStrategy || 'local_first'}`);
        
        // Itt a jövőben lehetne logikát hozzáadni a stratégia mentéséhez.
        // Jelenleg a kiválasztás csak a cache törlését és egy validációt végez.
        const templateResult = await hybridTemplateLoader.loadTemplate(
            templateId,
            "unified",
            "multilingual"
        );

        // A `questionsCache` törlése a fő `routes.ts`-ben történik, itt csak jelezzük a sikert.
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

// POST /api/admin/templates/upload - Új sablon feltöltése
router.post("/templates/upload", upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
      }

      const { originalname, path: tempPath } = req.file;
      const { name, type, language } = req.body;

      const storagePath = `templates/${Date.now()}-${originalname}`;
      await supabaseStorage.uploadFile(tempPath, storagePath);
      console.log(`[Upload] File uploaded to Supabase at: ${storagePath}`);

      const newTemplate = await storage.createTemplate({
        name: name || originalname,
        type: type || 'unified',
        language: language || 'multilingual',
        file_name: originalname,
        file_path: storagePath,
      });
      console.log(`[Upload] DB entry created for template ID: ${newTemplate.id}`);
      
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
        });
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

