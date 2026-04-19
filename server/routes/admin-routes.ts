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
//          ADMIN & AUDIT LOGS - ✅ JAVÍTOTT
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

// 🔥 JAVÍTOTT AUDIT LOGS VÉGPONT - UUID CASTING + HELYES OSZLOPNEVEK
router.get('/audit-logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    console.log(`📜 Fetching last ${limit} audit logs with correct column names...`);

    // ✅ JAVÍTÁS: p.full_name -> p.name (a profiles táblában name van, nem full_name!)
    const result = await (db as any).execute(sql`
      SELECT 
        al.id, 
        al.user_id::text as user_id,
        al.user_email,
        al.action, 
        al.resource_type,
        al.resource_id,
        al.details, 
        al.status, 
        al.error_message, 
        al.ip_address, 
        al.user_agent, 
        al.created_at,
        p.email as user_email_joined, 
        p.name as user_name_joined
      FROM audit_logs al 
      LEFT JOIN profiles p ON al.user_id::text = p.user_id::text 
      ORDER BY al.created_at DESC 
      LIMIT ${limit}
    `);

    const rows = Array.isArray(result) ? result : (result?.rows || []);

    // Összefésüljük a user adatokat
    const logs = rows.map((row: any) => ({
      ...row,
      user: row.user_email_joined ? { 
        email: row.user_email_joined, 
        name: row.user_name_joined || row.user_email_joined.split('@')[0]
      } : (row.user_email ? { 
        email: row.user_email, 
        name: row.user_email.split('@')[0] 
      } : null),
    }));

    console.log(`✅ Retrieved ${logs.length} audit log entries with correct columns`);
    res.json(logs);

  } catch (error: any) {
    console.error('❌ Failed to fetch audit logs:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Hiba történt a naplók lekérdezése során.',
      error: error.message 
    });
  }
});

router.get('/audit-logs/health', async (_req, res) => {
  try {
    const result = await (db as any).execute(
      sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') as table_exists`
    );
    const rows = Array.isArray(result) ? result : (result?.rows || []);
    const tableExists = rows[0]?.table_exists ?? false;

    let rowCount = 0;
    if (tableExists) {
      const countResult = await (db as any).execute(sql`SELECT COUNT(*) as count FROM audit_logs`);
      const countRows = Array.isArray(countResult) ? countResult : (countResult?.rows || []);
      rowCount = parseInt(countRows[0]?.count || '0', 10);
    }

    res.json({
      audit_logs_table_exists: tableExists,
      audit_logs_count: rowCount,
      environment: process.env.NODE_ENV || 'development',
      database_url_set: !!process.env.DATABASE_URL,
    });
  } catch (error: any) {
    console.error('❌ Audit health check failed:', error?.message);
    res.status(500).json({ error: error?.message || 'Health check failed' });
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
      name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
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
      // user_id nincs a schema-ban, raw SQL-t használunk
      const userProtocols = await (db as any)
        .select({ id: protocols.id })
        .from(protocols)
        .where(sql`"protocols"."user_id" = ${id}`);
      
      if (userProtocols.length > 0) {
        // Töröljük az összes protokollt
        await (db as any)
          .delete(protocols)
          .where(sql`"protocols"."user_id" = ${id}`);
        
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
//      USER ROLE CHANGE
// ===============================================

router.patch('/users/:id/role', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const adminUser = (req as any).user;

  const validRoles = ['admin', 'user', 'technician'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Érvénytelen szerepkör. Lehetséges értékek: admin, user, technician' });
  }

  if (id === adminUser.id && role !== 'admin') {
    return res.status(400).json({ message: 'Admin nem változtathatja meg saját szerepkörét.' });
  }

  try {
    await db.execute(
      sql`UPDATE profiles SET role = ${role} WHERE user_id = ${id}`
    );

    // Supabase app_metadata szinkronizáció – hogy a middleware ne írja vissza az old role-t
    try {
      await supabaseAdmin.auth.admin.updateUserById(id, {
        app_metadata: { role }
      });
      console.log(`✅ Supabase app_metadata updated: user ${id} → role ${role}`);
    } catch (metaErr: any) {
      console.warn(`⚠️ Supabase metadata update failed (non-fatal):`, metaErr.message);
    }

    console.log(`✅ Admin ${adminUser.id} changed user ${id} role to ${role}`);
    res.json({ message: 'Szerepkör sikeresen frissítve.', role });
  } catch (error: any) {
    console.error('❌ Role change error:', error);
    res.status(500).json({ message: 'Hiba a szerepkör módosításakor.', error: error.message });
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

router.get("/templates/:id/preview", async (req, res) => {
  const templateId = req.params.id;
  try {
    const template = await storage.getTemplate(templateId);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }
    res.json({
      id: template.id,
      name: template.name,
      type: template.type,
      language: template.language,
      file_name: template.file_name,
      is_active: template.is_active,
      created_at: template.created_at,
      load_strategy: template.load_strategy,
    });
  } catch (error: any) {
    console.error("Error fetching template preview:", error);
    res.status(500).json({ message: "Failed to load template preview" });
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
          title: q.title || q.titleHu || q.titleDe || `Question ${q.questionId}`,
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
          option_cells: q.optionCells ?? null, // select_extended típushoz
          default_if_hidden: q.defaultIfHidden ?? null, // conditional_group_key-hez: alapértelmezett érték ha rejtett
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

const queryRows = async (query: any) => {
  const result = await (db as any).execute(query);
  return Array.isArray(result) ? result : (result?.rows || []);
};

router.get('/backup/create', requireAdmin, async (req, res) => {
  try {
    console.log('📦 Creating database backup...');

    const protocolsRows = await queryRows(sql`SELECT * FROM protocols ORDER BY created_at DESC`);
    const templatesRows = await queryRows(sql`SELECT id, name, type, file_name, file_path, language, uploaded_at, is_active FROM templates ORDER BY uploaded_at DESC`);
    const questionConfigsRows = await queryRows(sql`SELECT * FROM question_configs ORDER BY group_order`);
    const liftTypesRows = await queryRows(sql`SELECT * FROM lift_types ORDER BY sort_order`);
    const liftSubtypesRows = await queryRows(sql`SELECT * FROM lift_subtypes ORDER BY sort_order`);
    const liftMappingsRows = await queryRows(sql`SELECT * FROM lift_template_mappings`);
    const profilesRows = await queryRows(sql`SELECT * FROM profiles`);

    let auditLogsRows: any[] = [];
    try {
      auditLogsRows = await queryRows(sql`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500`);
    } catch (e) {
      console.warn('⚠️ audit_logs table not available for backup');
    }

    const backup = {
      version: '0.9.7',
      created_at: new Date().toISOString(),
      tables: {
        protocols: protocolsRows,
        templates: templatesRows,
        question_configs: questionConfigsRows,
        lift_types: liftTypesRows,
        lift_subtypes: liftSubtypesRows,
        lift_template_mappings: liftMappingsRows,
        profiles: profilesRows,
        audit_logs: auditLogsRows,
      },
      counts: {
        protocols: protocolsRows.length,
        templates: templatesRows.length,
        question_configs: questionConfigsRows.length,
        lift_types: liftTypesRows.length,
        lift_subtypes: liftSubtypesRows.length,
        lift_template_mappings: liftMappingsRows.length,
        profiles: profilesRows.length,
        audit_logs: auditLogsRows.length,
      },
    };

    try {
      await createManualAuditLog(req, 'settings.update', 'backup', 'all', { action: 'backup_created', counts: backup.counts }, 'success', 'Database backup created');
    } catch (e) { /* audit log failure should not block backup */ }

    const fileName = `otis-aprod-backup-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    console.log(`✅ Backup created: ${Object.values(backup.counts).reduce((a: number, b: number) => a + b, 0)} total records`);
    res.json(backup);
  } catch (error: any) {
    console.error('❌ Backup creation failed:', error?.message);
    res.status(500).json({ message: error?.message || 'Backup creation failed' });
  }
});

router.post('/backup/restore', requireAdmin, async (req, res) => {
  try {
    const backup = req.body;

    if (!backup || !backup.tables || !backup.version) {
      return res.status(400).json({ message: 'Invalid backup file format' });
    }

    console.log(`📦 Restoring backup from ${backup.created_at}, version ${backup.version}...`);

    const restored: Record<string, number> = {};

    await (db as any).execute(sql`BEGIN`);

    try {
      await (db as any).execute(sql`DELETE FROM lift_template_mappings`);
      await (db as any).execute(sql`DELETE FROM lift_subtypes`);
      await (db as any).execute(sql`DELETE FROM lift_types`);
      await (db as any).execute(sql`DELETE FROM question_configs`);
      await (db as any).execute(sql`DELETE FROM protocols`);

      if (backup.tables.protocols) {
        for (const row of backup.tables.protocols) {
          await (db as any).execute(sql`
            INSERT INTO protocols (id, reception_date, language, answers, errors, signature, signature_name, completed, created_at)
            VALUES (${row.id}, ${row.reception_date}, ${row.language}, ${JSON.stringify(row.answers)}::jsonb, ${JSON.stringify(row.errors)}::jsonb, ${row.signature}, ${row.signature_name}, ${row.completed}, ${row.created_at ? new Date(row.created_at) : new Date()})
            ON CONFLICT (id) DO NOTHING
          `);
        }
        restored.protocols = backup.tables.protocols.length;
      }

      if (backup.tables.templates) {
        for (const row of backup.tables.templates) {
          await (db as any).execute(sql`
            INSERT INTO templates (id, name, type, file_name, file_path, language, uploaded_at, is_active)
            VALUES (${row.id}, ${row.name}, ${row.type}, ${row.file_name}, ${row.file_path}, ${row.language || 'multilingual'}, ${row.uploaded_at ? new Date(row.uploaded_at) : new Date()}, ${row.is_active ?? false})
            ON CONFLICT (id) DO UPDATE SET name = ${row.name}, type = ${row.type}, file_name = ${row.file_name}, file_path = ${row.file_path}, language = ${row.language || 'multilingual'}, is_active = ${row.is_active ?? false}
          `);
        }
        restored.templates = backup.tables.templates.length;
      }

      if (backup.tables.question_configs) {
        for (const row of backup.tables.question_configs) {
          await (db as any).execute(sql`
            INSERT INTO question_configs (id, template_id, question_id, title, title_hu, title_de, title_en, title_fr, title_it, type, required, placeholder, placeholder_de, placeholder_en, placeholder_fr, placeholder_it, cell_reference, sheet_name, multi_cell, group_name, group_name_de, group_name_en, group_name_fr, group_name_it, group_key, group_order, conditional_group_key, unit, min_value, max_value, calculation_formula, calculation_inputs, options, option_cells, default_if_hidden, max_length, created_at)
            VALUES (${row.id}, ${row.template_id}, ${row.question_id}, ${row.title}, ${row.title_hu}, ${row.title_de}, ${row.title_en}, ${row.title_fr}, ${row.title_it}, ${row.type}, ${row.required ?? true}, ${row.placeholder}, ${row.placeholder_de}, ${row.placeholder_en}, ${row.placeholder_fr}, ${row.placeholder_it}, ${row.cell_reference}, ${row.sheet_name || 'Sheet1'}, ${row.multi_cell ?? false}, ${row.group_name}, ${row.group_name_de}, ${row.group_name_en}, ${row.group_name_fr}, ${row.group_name_it}, ${row.group_key}, ${row.group_order || 0}, ${row.conditional_group_key}, ${row.unit}, ${row.min_value}, ${row.max_value}, ${row.calculation_formula}, ${row.calculation_inputs ? JSON.stringify(row.calculation_inputs) : null}::jsonb, ${row.options}, ${row.option_cells}, ${row.default_if_hidden}, ${row.max_length}, ${row.created_at ? new Date(row.created_at) : new Date()})
            ON CONFLICT (id) DO NOTHING
          `);
        }
        restored.question_configs = backup.tables.question_configs.length;
      }

      if (backup.tables.lift_types) {
        for (const row of backup.tables.lift_types) {
          await (db as any).execute(sql`
            INSERT INTO lift_types (id, code, name_hu, name_de, description_hu, description_de, sort_order, is_active, created_at, updated_at)
            VALUES (${row.id}, ${row.code}, ${row.name_hu}, ${row.name_de}, ${row.description_hu}, ${row.description_de}, ${row.sort_order || 0}, ${row.is_active ?? true}, ${row.created_at ? new Date(row.created_at) : new Date()}, ${row.updated_at ? new Date(row.updated_at) : new Date()})
            ON CONFLICT (id) DO NOTHING
          `);
        }
        restored.lift_types = backup.tables.lift_types.length;
      }

      if (backup.tables.lift_subtypes) {
        for (const row of backup.tables.lift_subtypes) {
          await (db as any).execute(sql`
            INSERT INTO lift_subtypes (id, lift_type_id, code, name_hu, name_de, description_hu, description_de, sort_order, is_active, created_at, updated_at)
            VALUES (${row.id}, ${row.lift_type_id}, ${row.code}, ${row.name_hu}, ${row.name_de}, ${row.description_hu}, ${row.description_de}, ${row.sort_order || 0}, ${row.is_active ?? true}, ${row.created_at ? new Date(row.created_at) : new Date()}, ${row.updated_at ? new Date(row.updated_at) : new Date()})
            ON CONFLICT (id) DO NOTHING
          `);
        }
        restored.lift_subtypes = backup.tables.lift_subtypes.length;
      }

      if (backup.tables.lift_template_mappings) {
        for (const row of backup.tables.lift_template_mappings) {
          await (db as any).execute(sql`
            INSERT INTO lift_template_mappings (id, lift_subtype_id, question_template_id, protocol_template_id, is_active, created_at, updated_at, created_by, notes)
            VALUES (${row.id}, ${row.lift_subtype_id}, ${row.question_template_id}, ${row.protocol_template_id}, ${row.is_active ?? true}, ${row.created_at ? new Date(row.created_at) : new Date()}, ${row.updated_at ? new Date(row.updated_at) : new Date()}, ${row.created_by}, ${row.notes})
            ON CONFLICT (id) DO NOTHING
          `);
        }
        restored.lift_template_mappings = backup.tables.lift_template_mappings.length;
      }

      if (backup.tables.profiles) {
        for (const row of backup.tables.profiles) {
          await (db as any).execute(sql`
            INSERT INTO profiles (user_id, email, name, role, address, is_active, created_at, updated_at)
            VALUES (${row.user_id}, ${row.email}, ${row.name}, ${row.role || 'user'}, ${row.address}, ${row.is_active ?? true}, ${row.created_at ? new Date(row.created_at) : new Date()}, ${row.updated_at ? new Date(row.updated_at) : new Date()})
            ON CONFLICT (user_id) DO UPDATE SET name = ${row.name}, role = ${row.role || 'user'}, address = ${row.address}, is_active = ${row.is_active ?? true}
          `);
        }
        restored.profiles = backup.tables.profiles.length;
      }

      await (db as any).execute(sql`COMMIT`);
    } catch (txError: any) {
      await (db as any).execute(sql`ROLLBACK`);
      throw new Error(`Restore failed, all changes rolled back: ${txError.message}`);
    }

    try {
      await createManualAuditLog(req, 'settings.update', 'backup', 'all', { action: 'backup_restored', restored }, 'success', 'Database restored from backup');
    } catch (e) { /* audit log failure should not block restore response */ }

    console.log(`✅ Backup restored:`, restored);
    res.json({ message: 'Backup restored successfully', restored });
  } catch (error: any) {
    console.error('❌ Backup restore failed:', error?.message);
    res.status(500).json({ message: error?.message || 'Backup restore failed' });
  }
});

export const adminRoutes = router;