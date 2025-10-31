// server/routes/admin-routes.ts
import express from 'express';
import multer from 'multer';
import path from 'path';
import * as fs from 'fs';
import { storage } from '../storage.js';
import { supabaseStorage } from '../services/supabase-storage.js';
import { excelParserService } from '../services/excel-parser.js';
import { hybridTemplateLoader } from '../services/hybrid-template-loader.js';
import { clearQuestionsCache } from '../routes.js';
import { requireAdmin } from '../middleware/auth.js';
import { auditLog } from '../middleware/audit-logger.js';
import { db } from '../db.js';
import { sql } from 'drizzle-orm';

const router = express.Router();

const uploadDir = process.env.NODE_ENV === 'production' ? '/tmp' : path.join(process.cwd(), 'uploads');
if (process.env.NODE_ENV !== 'production' && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

// ===============================================
//          SYSTEM SETTINGS & MANAGEMENT
// ===============================================

// GET /api/admin/system/info - Rendszerinformációk lekérdezése
router.get('/system/info', requireAdmin, async (_req, res) => {
  try {
    console.log('ℹ️ Fetching system information...');
    
    let databaseSize = 'N/A';
    if (process.env.NODE_ENV === "production") {
      // PostgreSQL (Neon)
      const result: any[] = await (db as any).execute(sql`SELECT pg_size_pretty(pg_database_size(current_database()))`);
      if (result.length > 0) {
        databaseSize = result[0].pg_size_pretty;
      }
    } else {
      // SQLite (development)
      const dbPath = path.join(process.cwd(), "data", "otis_aprod.db");
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        databaseSize = `${(stats.size / (1024 * 1024)).toFixed(2)} MB`;
      }
    }
    
    // Uptime és memória információk
    const uptimeInSeconds = process.uptime();
    const memory = process.memoryUsage();
    
    const info = {
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV,
      databaseSize: databaseSize,
      uptime: formatUptime(uptimeInSeconds),
      memoryUsage: {
        used: `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      },
    };
    
    console.log('✅ System information retrieved:', info);
    res.json(info);
  } catch (error) {
    console.error('❌ Failed to fetch system info:', error);
    res.status(500).json({ message: 'Hiba történt a rendszerinformációk lekérdezése során.' });
  }
});

/**
 * Segédfüggvény a másodpercek formázásához (nap, óra, perc)
 */
function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor(seconds % (3600 * 24) / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  
  const dDisplay = d > 0 ? d + (d === 1 ? " nap, " : " nap, ") : "";
  const hDisplay = h > 0 ? h + (h === 1 ? " óra, " : " óra, ") : "";
  const mDisplay = m > 0 ? m + (m === 1 ? " perc" : " perc") : "";
  
  // Eltávolítja a felesleges vesszőt a végéről
  let result = (dDisplay + hDisplay + mDisplay).trim();
  if (result.endsWith(',')) {
    result = result.slice(0, -1);
  }
  return result || 'Kevesebb mint egy perce';
}

// ===============================================
//          ADMIN & AUDIT LOGS
// ===============================================

// GET /api/admin/stats - Dashboard statisztikák
router.get('/stats', requireAdmin, async (_req, res) => {
  try {
    console.log('📊 Fetching admin dashboard statistics...');
    
    // Párhuzamosan kérjük le az összes statisztikát a jobb teljesítmény érdekében
    const [usersCount, protocolsCount, templatesCount, activeTemplatesCount, recentProtocols] = await Promise.all([
      storage.getUsersCount(),
      storage.getProtocolsCount(),
      storage.getTemplatesCount(),
      storage.getActiveTemplatesCount(),
      storage.getRecentProtocols(5),
    ]);

    const stats = {
      users: {
        total: usersCount,
      },
      protocols: {
        total: protocolsCount,
        recent: recentProtocols,
      },
      templates: {
        total: templatesCount,
        active: activeTemplatesCount,
      },
    };

    console.log(`✅ Dashboard stats compiled:`, {
      users: stats.users.total,
      protocols: stats.protocols.total,
      templates: `${stats.templates.active}/${stats.templates.total}`,
    });

    res.json(stats);
  } catch (error) {
    console.error('❌ Failed to fetch dashboard stats:', error);
    res.status(500).json({ message: 'Hiba történt a statisztikák lekérdezése során.' });
  }
});

// GET /api/admin/audit-logs - Audit naplók lekérdezése
router.get('/audit-logs', requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    
    console.log(`📜 Fetching audit logs (limit: ${limit})...`);
    const logs = await storage.getAuditLogs(limit);
    
    console.log(`✅ Retrieved ${logs.length} audit log entries`);
    res.json(logs);
  } catch (error) {
    console.error('❌ Failed to fetch audit logs:', error);
    res.status(500).json({ message: 'Hiba történt a naplók lekérdezése során.' });
  }
});

// ===============================================
//          USER MANAGEMENT
// ===============================================

// GET /api/admin/users - Összes felhasználó listázása
router.get('/users', requireAdmin, async (_req, res) => {
  try {
    console.log('📋 Fetching all user profiles...');
    const users = await storage.getAllProfiles();
    console.log(`✅ Found ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error('❌ Failed to fetch users:', error);
    res.status(500).json({ message: 'Hiba történt a felhasználók lekérdezése során.' });
  }
});

// DELETE /api/admin/users/:id - Egy felhasználó törlése
router.delete('/users/:id', 
  requireAdmin, 
  auditLog('user.delete', {
    resourceType: 'user',
    getDetails: (req) => {
      const { id } = req.params;
      return { deleted_user_id: id };
    }
  }),
  async (req, res) => {
  const { id } = req.params;
  const adminPerformingAction = (req as any).user;

  console.log(`🗑️ Admin ${adminPerformingAction.id} attempting to delete user ${id}`);

  // Biztonsági ellenőrzés: Admin ne tudja törölni saját magát
  if (id === adminPerformingAction.id) {
    console.warn('⚠️ Admin attempted to delete themselves');
    return res.status(400).json({ message: 'Admin nem törölheti saját magát.' });
  }

  try {
    const success = await storage.deleteProfile(id);

    if (!success) {
      console.warn(`⚠️ User ${id} not found for deletion`);
      return res.status(404).json({ message: 'A felhasználó nem található.' });
    }

    console.log(`✅ User ${id} successfully deleted by admin ${adminPerformingAction.id}`);
    res.status(200).json({ message: 'Felhasználó sikeresen törölve.' });
  } catch (error) {
    console.error(`❌ Failed to delete user ${id}:`, error);
    res.status(500).json({ message: 'Hiba történt a felhasználó törlése során.' });
  }
});

// ===============================================
//          TEMPLATE MANAGEMENT
// ===============================================

// GET /api/admin/templates/available - Helyi és távoli sablonok listázása
router.get("/templates/available", requireAdmin, async (_req, res) => {
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
router.post("/templates/select", requireAdmin, async (req, res) => {
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
router.get("/templates", requireAdmin, async (_req, res) => {
  try {
    const templates = await storage.getAllTemplates();
    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ message: "Failed to fetch templates" });
  }
});

// GET /api/admin/templates/:id/download - Sablon letöltése
router.get("/templates/:id/download", 
  requireAdmin,
  auditLog('template.download', {
    resourceType: 'template',
    getDetails: (req) => {
      const template = (req as any).downloadedTemplate;
      return template ? {
        template_name: template.name,
        file_name: template.file_name
      } : undefined;
    }
  }),
  async (req, res) => {
  try {
    const templateId = req.params.id;
    console.log(`[DOWNLOAD] Request received for template ID: ${templateId}`);

    const template = await storage.getTemplate(templateId);

    if (!template) {
      console.error(`[DOWNLOAD] Error: Template not found with ID: ${templateId}`);
      return res.status(404).json({ message: "Template not found" });
    }
    
    // Az audit log számára eltároljuk a template adatait
    (req as any).downloadedTemplate = template;

    const filePath = template.file_path;
    if (!filePath) {
      console.error('[DOWNLOAD] Error: file_path is missing for this template.');
      return res.status(500).json({ message: 'File path is missing for this template.' });
    }
    
    const tempLocalPath = path.join(uploadDir, `download-${Date.now()}-${template.file_name}`);
    
    console.log(`[DOWNLOAD] Attempting to download from storage path: ${filePath} to ${tempLocalPath}`);
    await supabaseStorage.downloadFile(filePath, tempLocalPath);
    console.log(`[DOWNLOAD] File downloaded successfully to temp path.`);

    res.download(tempLocalPath, template.file_name, (err) => {
      if (err) {
        console.error("Error sending file to client:", err);
      }
      
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
router.post("/templates/upload", 
  requireAdmin, 
  upload.single('file'),
  auditLog('template.upload', {
    resourceType: 'template',
    getResourceId: (req) => (req as any).uploadedTemplateId,
    getDetails: (req) => ({
      template_name: req.body.name,
      template_type: req.body.type,
      file_name: req.file?.originalname
    })
  }),
  async (req: any, res) => {
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
    
    // Az audit log számára eltároljuk a template ID-t
    (req as any).uploadedTemplateId = newTemplate.id;

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
router.post("/templates/:id/activate", 
  requireAdmin,
  auditLog('template.activate', {
    resourceType: 'template',
    getDetails: (req) => {
      const template = (req as any).activatedTemplate;
      return template ? {
        template_name: template.name,
        template_type: template.type
      } : undefined;
    }
  }),
  async (req, res) => {
  try {
    const template = await storage.getTemplate(req.params.id);
    (req as any).activatedTemplate = template;
    
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
router.delete("/templates/:id", 
  requireAdmin,
  auditLog('template.delete', {
    resourceType: 'template',
    getDetails: (req) => {
      const template = (req as any).deletedTemplate;
      return template ? {
        template_name: template.name,
        template_type: template.type,
        file_name: template.file_name
      } : undefined;
    }
  }),
  async (req, res) => {
  try {
    const templateId = req.params.id;
    const template = await storage.getTemplate(templateId);

    if (!template) {
      return res.status(404).json({ message: "Template to delete not found." });
    }
    
    // Az audit log számára eltároljuk a template adatait
    (req as any).deletedTemplate = template;

    await storage.deleteQuestionConfigsByTemplate(templateId);

    if (template.file_path) {
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