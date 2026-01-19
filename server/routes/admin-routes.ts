// server/routes/admin-routes.ts - TELJES JAVÍTOTT VERZIÓ
import express from 'express';
import multer from 'multer';
import path from 'path';
import * as fs from 'fs';
import { storage } from '../storage.js';
import { supabaseAdmin } from '../supabaseAdmin.js'; // ✅ ÚJ IMPORT
import { supabaseStorage } from '../services/supabase-storage.js';
import { excelParserService } from '../services/excel-parser.js';
import { hybridTemplateLoader } from '../services/hybrid-template-loader.js';
import { clearQuestionsCache } from '../routes.js';
import { requireAdmin } from '../middleware/auth.js';
import { createManualAuditLog } from '../middleware/audit-logger.js';
import { db } from '../db.js';
import { sql, eq } from 'drizzle-orm'; // ✅ eq HOZZÁADVA
import { protocols } from '../db.js'; // ✅ ÚJ IMPORT (protokollok törléséhez)

const router = express.Router();

const uploadDir = process.env.NODE_ENV === 'production' ? '/tmp' : path.join(process.cwd(), 'uploads');
if (process.env.NODE_ENV !== 'production' && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

// ===============================================
//          SYSTEM SETTINGS & MANAGEMENT
// ===============================================

// MÓDOSÍTVA: requireAdmin eltávolítva, hogy a USER is lássa
router.get('/system/info', async (_req, res) => {
  try {
    console.log('ℹ️ Fetching system information...');
    
    let databaseSize = 'N/A';
    if (process.env.NODE_ENV === "production") {
      const result: any[] = await (db as any).execute(sql`SELECT pg_size_pretty(pg_database_size(current_database()))`);
      if (result.length > 0) {
        databaseSize = result[0].pg_size_pretty;
      }
    } else {
      const dbPath = path.join(process.cwd(), "data", "otis_aprod.db");
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        databaseSize = `${(stats.size / (1024 * 1024)).toFixed(2)} MB`;
      }
    }
    
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

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor(seconds % (3600 * 24) / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  
  const dDisplay = d > 0 ? d + (d === 1 ? " nap, " : " nap, ") : "";
  const hDisplay = h > 0 ? h + (h === 1 ? " óra, " : " óra, ") : "";
  const mDisplay = m > 0 ? m + (m === 1 ? " perc" : " perc") : "";
  
  let result = (dDisplay + hDisplay + mDisplay).trim();
  if (result.endsWith(',')) {
    result = result.slice(0, -1);
  }
  return result || 'Kevesebb mint egy perce';
}

// ===============================================
//          ADMIN & AUDIT LOGS
// ===============================================

// MARADT: requireAdmin (Dashboard csak adminnak)
router.get('/stats', requireAdmin, async (_req, res) => {
  try {
    console.log('📊 Fetching admin dashboard statistics...');
    
    const [usersCount, protocolsCount, templatesCount, activeTemplatesCount, recentProtocols] = await Promise.all([
      storage.getUsersCount(),
      storage.getProtocolsCount(),
      storage.getTemplatesCount(),
      storage.getActiveTemplatesCount(),
      storage.getRecentProtocols(5),
    ]);

    const stats = {
      users: { total: usersCount },
      protocols: { total: protocolsCount, recent: recentProtocols },
      templates: { total: templatesCount, active: activeTemplatesCount },
    };

    console.log(`✅ Dashboard stats compiled`);
    res.json(stats);
  } catch (error) {
    console.error('❌ Failed to fetch dashboard stats:', error);
    res.status(500).json({ message: 'Hiba történt a statisztikák lekérdezése során.' });
  }
});

// MÓDOSÍTVA: requireAdmin eltávolítva, hogy a USER is lássa a naplót
router.get('/audit-logs', async (req, res) => {
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
//          USER MANAGEMENT - ✅ JAVÍTOTT VERZIÓ
// ===============================================

// MARADT: requireAdmin (Felhasználókezelés csak adminnak)
router.get('/users', requireAdmin, async (_req, res) => {
  try {
    console.log('📋 Fetching all users from Supabase Auth...');
    
    // ✅ Közvetlenül a Supabase Auth API-ból kérjük le a felhasználókat
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Failed to fetch users from Supabase Auth:', authError);
      throw authError;
    }
    
    // ✅ Átalakítjuk a frontend által elvárt formátumra
    const users = authData.users.map((user) => ({
      user_id: user.id,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
      email: user.email || null,
      role: user.user_metadata?.role || user.app_metadata?.role || 'user',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at || null,
    }));
    
    console.log(`✅ Found ${users.length} users from Supabase Auth`);
    res.json(users);
    
  } catch (error: any) {
    console.error('❌ Failed to fetch users:', error);
    res.status(500).json({ 
      message: 'Hiba történt a felhasználók lekérdezése során.',
      error: error.message 
    });
  }
});

// ✅ VÉGLEGES JAVÍTÁS: Felhasználó törlése (Auth + Protocols)
router.delete('/users/:id', requireAdmin, async (req, res, next) => {
  const { id } = req.params;
  const adminPerformingAction = (req as any).user;

  console.log(`🗑️ Admin ${adminPerformingAction.id} attempting to PERMANENTLY delete user ${id}`);

  // Biztonsági ellenőrzés: Admin nem törölheti saját magát
  if (id === adminPerformingAction.id) {
    console.warn('⚠️ Admin attempted to delete themselves');
    
    await createManualAuditLog(
      req, 
      'user.delete', 
      'user', 
      id,
      { reason: 'Admin attempted to delete themselves' },
      'failure',
      'Admin nem törölheti saját magát'
    );
    
    return res.status(400).json({ message: 'Admin nem törölheti saját magát.' });
  }

  try {
    // ==============================================
    // 🔥 1. Supabase Auth User Törlése
    // ==============================================
    console.log(`🔥 Deleting user ${id} from Supabase Auth...`);
    
    const { data, error } = await supabaseAdmin.auth.admin.deleteUser(id);
    
    if (error) {
      console.error(`❌ Failed to delete user ${id} from Supabase Auth:`, error.message);
      
      await createManualAuditLog(
        req,
        'user.delete',
        'user',
        id,
        { error: error.message, source: 'supabase_auth' },
        'failure',
        error.message
      );
      
      return res.status(500).json({ 
        message: 'Hiba történt a felhasználó törlése során.',
        error: error.message 
      });
    }

    console.log(`✅ User ${id} PERMANENTLY deleted from Supabase Auth`);

    // ==============================================
    // 🔥 2. Kapcsolódó Protokollok Törlése
    // ==============================================
    try {
      console.log(`🗑️ Deleting protocols for user ${id}...`);
      
      // Lekérjük a felhasználó összes protokollját
      const userProtocols = await (db as any)
        .select({ id: protocols.id })
        .from(protocols)
        .where(eq(protocols.user_id, id));
      
      if (userProtocols.length > 0) {
        // Töröljük az összes protokollt
        await (db as any)
          .delete(protocols)
          .where(eq(protocols.user_id, id));
        
        console.log(`✅ Deleted ${userProtocols.length} protocols for user ${id}`);
      } else {
        console.log(`ℹ️ No protocols found for user ${id}`);
      }
    } catch (protocolError: any) {
      // Nem kritikus hiba - csak logoljuk
      console.warn(`⚠️ Failed to delete protocols for user ${id}:`, protocolError.message);
    }

    // ==============================================
    // ✅ SIKER - Audit log
    // ==============================================
    await createManualAuditLog(
      req,
      'user.delete',
      'user',
      id,
      { 
        deleted_user_id: id, 
        method: 'supabase_admin_api',
        cascade_delete: 'protocols'
      },
      'success'
    );

    console.log(`✅ User ${id} and all related data successfully deleted by admin ${adminPerformingAction.id}`);
    res.status(200).json({ 
      message: 'Felhasználó és kapcsolódó adatai sikeresen törölve.' 
    });
    
  } catch (error: any) {
    console.error(`❌ Failed to delete user ${id}:`, error);
    
    await createManualAuditLog(
      req,
      'user.delete',
      'user',
      id,
      { error: error.message },
      'failure',
      error.message
    );
    
    // Továbbítjuk a hibát (ha van globális error handler)
    // Ha nincs, használd: res.status(500).json(...)
    if (next) {
      next(error);
    } else {
      res.status(500).json({ 
        message: 'Hiba történt a felhasználó törlése során.',
        error: error.message 
      });
    }
  }
});

// ===============================================
//          PROTOCOL MANAGEMENT
// ===============================================

// MARADT: requireAdmin (a kérésben nem szerepelt ennek a megnyitása)
router.get('/protocols', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    
    console.log(`📋 Fetching protocols (Page: ${page}, Limit: ${limit})...`);
    
    const protocols = await storage.getRecentProtocols(limit);
    const totalCount = await storage.getProtocolsCount();

    console.log(`✅ Found ${protocols.length} protocols (Total: ${totalCount})`);
    
    res.json({
      items: protocols,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      total: totalCount,
    });
  } catch (error) {
    console.error('❌ Failed to fetch protocols:', error);
    res.status(500).json({ message: 'Hiba történt a protokollok lekérdezése során.' });
  }
});

// MARADT: requireAdmin
router.get('/protocols/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📄 Fetching protocol details for ID: ${id}`);
    
    const protocol = await storage.getProtocol?.(id);
    
    if (!protocol) {
      return res.status(404).json({ message: 'Protokoll nem található.' });
    }
    
    console.log(`✅ Protocol found: ${protocol.protocol_number || id}`);
    res.json(protocol);
  } catch (error) {
    console.error('❌ Failed to fetch protocol:', error);
    res.status(500).json({ message: 'Hiba történt a protokoll lekérdezése során.' });
  }
});

// MARADT: requireAdmin
router.delete('/protocols/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    console.log(`🗑️ Attempting to delete protocol: ${id}`);
    
    const success = await storage.deleteProtocol?.(id);
    
    if (!success) {
      await createManualAuditLog(
        req,
        'protocol.delete',
        'protocol',
        id,
        { reason: 'Protocol not found' },
        'failure',
        'Protokoll nem található'
      );
      
      return res.status(404).json({ message: 'Protokoll nem található.' });
    }
    
    // ✅ SIKER - Audit log
    await createManualAuditLog(
      req,
      'protocol.delete',
      'protocol',
      id,
      { protocol_id: id },
      'success'
    );
    
    console.log(`✅ Protocol ${id} successfully deleted`);
    res.json({ success: true, message: 'Protokoll sikeresen törölve.' });
    
  } catch (error: any) {
    console.error('❌ Failed to delete protocol:', error);
    
    await createManualAuditLog(
      req,
      'protocol.delete',
      'protocol',
      id,
      { error: error.message },
      'failure',
      error.message
    );
    
    res.status(500).json({ message: 'Hiba történt a protokoll törlése során.' });
  }
});

// ===============================================
//          TEMPLATE MANAGEMENT
// ===============================================

import { 
  getAllLocalTemplates, 
  getLoadStrategy, 
  setLoadStrategy, 
  checkLocalTemplateExists,
  getTemplateRegistrySettings,
  TemplateLoadStrategy 
} from '../config/local-templates.js';

// Helyi sablonok listázása
router.get("/templates/local", async (_req, res) => {
  try {
    const localTemplates = getAllLocalTemplates();
    const templatesWithStatus = localTemplates.map(t => ({
      ...t,
      exists: checkLocalTemplateExists(t.path),
      source: 'local'
    }));
    
    console.log(`📁 Local templates found: ${templatesWithStatus.length}`);
    res.json(templatesWithStatus);
  } catch (error) {
    console.error("Error fetching local templates:", error);
    res.status(500).json({ message: "Failed to fetch local templates" });
  }
});

// Betöltési stratégia lekérdezése
router.get("/templates/settings", async (_req, res) => {
  try {
    const settings = getTemplateRegistrySettings();
    const currentStrategy = getLoadStrategy();
    
    res.json({
      loadStrategy: currentStrategy,
      cacheEnabled: settings.cacheEnabled,
      offlineSupport: settings.offlineSupport,
      availableStrategies: [
        { value: 'local_first', label_hu: 'Helyi először', label_de: 'Lokal zuerst' },
        { value: 'cache_first', label_hu: 'Cache először', label_de: 'Cache zuerst' },
        { value: 'remote_only', label_hu: 'Csak távoli', label_de: 'Nur Remote' }
      ]
    });
  } catch (error) {
    console.error("Error fetching template settings:", error);
    res.status(500).json({ message: "Failed to fetch template settings" });
  }
});

// Betöltési stratégia beállítása
router.post("/templates/settings", requireAdmin, async (req, res) => {
  try {
    const { loadStrategy } = req.body;
    
    if (!loadStrategy || !Object.values(TemplateLoadStrategy).includes(loadStrategy)) {
      return res.status(400).json({ message: "Invalid load strategy" });
    }
    
    const success = setLoadStrategy(loadStrategy as TemplateLoadStrategy);
    
    if (success) {
      await createManualAuditLog(
        req,
        'template.settings.update',
        'settings',
        'load_strategy',
        { loadStrategy },
        'success'
      );
      
      console.log(`✅ Load strategy updated to: ${loadStrategy}`);
      res.json({ success: true, loadStrategy });
    } else {
      throw new Error('Failed to save settings');
    }
  } catch (error) {
    console.error("Error updating template settings:", error);
    res.status(500).json({ message: "Failed to update template settings" });
  }
});

// MÓDOSÍTVA: requireAdmin eltávolítva
router.get("/templates/available", async (_req, res) => {
  try {
    const allTemplates = await hybridTemplateLoader.getAllAvailableTemplates();
    const activeTemplate = await storage.getActiveTemplate('unified', 'multilingual');
    const currentStrategy = getLoadStrategy();
    
    res.json({
      ...allTemplates,
      current: { 
        templateId: activeTemplate?.id,
        loadStrategy: currentStrategy
      }
    });
  } catch (error) {
    console.error("Error fetching available templates:", error);
    res.status(500).json({ message: "Failed to fetch available templates" });
  }
});

// ✅ JAVÍTÁS: loadTemplate hívás - mind a 4 paraméter átadása
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
      "multilingual",
      loadStrategy || 'local_first'
    );

    console.log(`✅ Template selection processed`);
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error selecting template:", error);
    res.status(500).json({ message: "Failed to select template" });
  }
});

// MÓDOSÍTVA: requireAdmin eltávolítva
router.get("/templates", async (_req, res) => {
  try {
    const templates = await storage.getAllTemplates();
    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ message: "Failed to fetch templates" });
  }
});

// MÓDOSÍTVA: requireAdmin eltávolítva
router.get("/templates/:id/download", async (req, res) => {
  const templateId = req.params.id;
  
  try {
    console.log(`[DOWNLOAD] Request received for template ID: ${templateId}`);

    const template = await storage.getTemplate(templateId);

    if (!template) {
      console.error(`[DOWNLOAD] Error: Template not found with ID: ${templateId}`);
      
      await createManualAuditLog(
        req,
        'template.download',
        'template',
        templateId,
        { reason: 'Template not found' },
        'failure',
        'Template not found'
      );
      
      return res.status(404).json({ message: "Template not found" });
    }

    const filePath = template.file_path;
    if (!filePath) {
      console.error('[DOWNLOAD] Error: file_path is missing');
      return res.status(500).json({ message: 'File path is missing' });
    }
    
    const tempLocalPath = path.join(uploadDir, `download-${Date.now()}-${template.file_name}`);
    
    console.log(`[DOWNLOAD] Downloading from storage: ${filePath}`);
    await supabaseStorage.downloadFile(filePath, tempLocalPath);
    console.log(`[DOWNLOAD] File downloaded successfully`);

    // ✅ SIKER - Audit log (res.download ELŐTT!)
    await createManualAuditLog(
      req,
      'template.download',
      'template',
      template.id,
      { 
        template_name: template.name,
        file_name: template.file_name 
      },
      'success'
    );

    res.download(tempLocalPath, template.file_name, (err) => {
      if (err) {
        console.error("Error sending file to client:", err);
      }
      
      fs.unlink(tempLocalPath, (unlinkErr) => {
        if (unlinkErr) console.error("Error deleting temp file:", unlinkErr);
        else console.log(`✅ Cleaned up temporary file`);
      });
    });

  } catch (error: any) {
    console.error("❌ Error during template download:", error);
    
    await createManualAuditLog(
      req,
      'template.download',
      'template',
      templateId,
      { error: error.message },
      'failure',
      error.message
    );
    
    res.status(500).json({ message: "Failed to download template file." });
  }
});

// MÓDOSÍTVA: requireAdmin eltávolítva
router.post("/templates/upload", upload.single('file'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const { originalname, path: tempPath } = req.file;
    const { name, type, language } = req.body;

    if (!type) {
      return res.status(400).json({ message: "Template 'type' required." });
    }

    const storagePath = `templates/${Date.now()}-${originalname}`;
    await supabaseStorage.uploadFile(tempPath, storagePath);
    console.log(`[Upload] File uploaded to Supabase at: ${storagePath}`);

    const newTemplate = await storage.createTemplate({
      name: name || originalname,
      type: type,
      language: language || 'multilingual',
      file_name: originalname,
      file_path: storagePath,
    });
    console.log(`[Upload] DB entry created for template ID: ${newTemplate.id}`);

    if (type === 'unified' || type === 'questions') {
      console.log(`Parsing questions for template type "${type}"...`);
      const questions = await excelParserService.parseQuestionsFromExcel(tempPath);
      console.log(`✅ Parsed ${questions.length} questions`);

      for (const q of questions) {
        if (!q.questionId) {
          console.warn("Skipping question due to missing questionId:", q);
          continue;
        }

        await storage.createQuestionConfig({
          template_id: newTemplate.id,
          question_id: q.questionId,
          title: q.title,
          title_hu: q.titleHu ?? null,
          title_de: q.titleDe ?? null,
          title_en: q.titleEn ?? null,
          title_fr: q.titleFr ?? null,
          title_it: q.titleIt ?? null,
          type: q.type,
          required: q.required ?? true,
          placeholder: q.placeholder ?? null,
          placeholder_de: q.placeholderDe ?? null,
          placeholder_en: q.placeholderEn ?? null,
          placeholder_fr: q.placeholderFr ?? null,
          placeholder_it: q.placeholderIt ?? null,
          cell_reference: q.cellReference ?? null,
          sheet_name: q.sheetName ?? 'Sheet1',
          multi_cell: q.multiCell ?? false,
          group_name: q.groupName ?? null,
          group_name_de: q.groupNameDe ?? null,
          group_name_en: q.groupNameEn ?? null,
          group_name_fr: q.groupNameFr ?? null,
          group_name_it: q.groupNameIt ?? null,
          group_key: q.groupKey ?? null,
          group_order: q.groupOrder ?? 0,
          conditional_group_key: q.conditionalGroupKey ?? null,
          unit: q.unit ?? null,
          min_value: q.minValue ?? null,
          max_value: q.maxValue ?? null,
          calculation_formula: q.calculationFormula ?? null,
          calculation_inputs: q.calculationInputs ? [q.calculationInputs] : null,
          options: q.options ?? null,
          options_de: q.optionsDe ?? null,
          options_en: q.optionsEn ?? null,
          options_fr: q.optionsFr ?? null,
          options_it: q.optionsIt ?? null,
          max_length: q.maxLength ?? null,
        });
      }
    } else {
      console.log(`Skipping question parsing for type "${type}".`);
    }

    // ✅ SIKER - Audit log
    await createManualAuditLog(
      req,
      'template.upload',
      'template',
      newTemplate.id,
      { 
        template_name: name,
        template_type: type,
        file_name: originalname 
      },
      'success'
    );

    res.status(201).json({ success: true, template: newTemplate });

  } catch (error: any) {
    console.error("❌ Error uploading template:", error);
    
    await createManualAuditLog(
      req,
      'template.upload',
      'template',
      undefined,
      { 
        template_name: req.body.name,
        error: error.message 
      },
      'failure',
      error.message
    );
    
    res.status(500).json({ message: "Failed to upload template." });
  } finally {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    }
  }
});

// MÓDOSÍTVA: requireAdmin eltávolítva
router.post("/templates/:id/activate", async (req, res) => {
  const templateId = req.params.id;
  
  try {
    const template = await storage.getTemplate(templateId);
    
    if (!template) {
      await createManualAuditLog(
        req,
        'template.activate',
        'template',
        templateId,
        { reason: 'Template not found' },
        'failure',
        'Template not found'
      );
      
      return res.status(404).json({ message: "Template not found" });
    }
    
    await storage.setActiveTemplate(templateId);
    hybridTemplateLoader.clearCache();
    clearQuestionsCache();
    
    // ✅ SIKER - Audit log
    await createManualAuditLog(
      req,
      'template.activate',
      'template',
      template.id,
      { 
        template_name: template.name,
        template_type: template.type 
      },
      'success'
    );
    
    console.log('✅ Template activated and cache cleared');
    res.json({ success: true });
    
  } catch (error: any) {
    console.error("Error activating template:", error);
    
    await createManualAuditLog(
      req,
      'template.activate',
      'template',
      templateId,
      { error: error.message },
      'failure',
      error.message
    );
    
    res.status(500).json({ message: "Failed to activate template" });
  }
});

// MÓDOSÍTVA: requireAdmin eltávolítva
router.delete("/templates/:id", async (req, res) => {
  const templateId = req.params.id;
  
  try {
    const template = await storage.getTemplate(templateId);

    if (!template) {
      await createManualAuditLog(
        req,
        'template.delete',
        'template',
        templateId,
        { reason: 'Template not found' },
        'failure',
        'Template not found'
      );
      
      return res.status(404).json({ message: "Template to delete not found." });
    }

    await storage.deleteQuestionConfigsByTemplate(templateId);

    if (template.file_path) {
      await supabaseStorage.deleteFile(template.file_path);
    }

    await storage.deleteTemplate(templateId);

    // ✅ SIKER - Audit log
    await createManualAuditLog(
      req,
      'template.delete',
      'template',
      template.id,
      { 
        template_name: template.name,
        template_type: template.type,
        file_name: template.file_name 
      },
      'success'
    );

    console.log(`✅ Template ${templateId} deleted successfully`);
    res.json({ success: true });
    
  } catch (error: any) {
    console.error("Error deleting template:", error);
    
    await createManualAuditLog(
      req,
      'template.delete',
      'template',
      templateId,
      { error: error.message },
      'failure',
      error.message
    );
    
    res.status(500).json({ message: "Failed to delete template" });
  }
});

export const adminRoutes = router;