// server/storage.ts
// ------------------------------------------------------------
// 1️⃣ Imports – keep the same schema objects that the db instance uses
// ------------------------------------------------------------
import {
  type Protocol,
  type InsertProtocol,
  type Template,
  type InsertTemplate,
  type QuestionConfig,
  type InsertQuestionConfig,
  type Profile,
  type InsertProfile,
  // --- ÚJ IMPORT: Audit Logs ---
  type AuditLog,
  type InsertAuditLog,
  // Re-exported table definitions from the db module – this guarantees
  // the exact same type instances the DB was initialised with.
  protocols,
  templates,
  questionConfigs,
  profiles,
  // --- ÚJ TÁBLA IMPORT ---
  audit_logs,
} from "./db.js";

import { db } from "./db.js"; // Drizzle connection
import { eq, and, desc, sql } from "drizzle-orm"; // Drizzle helpers + sql for aggregations
import { supabaseAdmin } from "./supabaseAdmin.js";

// ------------------------------------------------------------
// 2️⃣ IStorage interface – FRISSÍTVE
// ------------------------------------------------------------
export interface IStorage {
  /* ---------- Protocols ---------- */
  getProtocol(id: string): Promise<Protocol | undefined>;
  // ✅ JAVÍTÁS: Új, lapozható getProtocols függvény
  getProtocols(options: {
    userId: string;
    page: number;
    limit: number;
    offset: number;
  }): Promise<{ items: Protocol[]; total: number }>;
  createProtocol(protocol: InsertProtocol): Promise<Protocol>;
  updateProtocol(
    id: string,
    updates: Partial<Protocol>,
  ): Promise<Protocol | undefined>;
  getAllProtocols(): Promise<Protocol[]>;
  // ✅ JAVÍTÁS: userId opcionális lett (admin override támogatás)
  deleteProtocol(id: string, userId?: string): Promise<boolean>;

  /* ---------- Templates ---------- */
  getTemplate(id: string): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(
    id: string,
    updates: Partial<Template>,
  ): Promise<Template | undefined>;
  getAllTemplates(): Promise<Template[]>;
  getActiveTemplate(
    type: string,
    language: string,
  ): Promise<Template | undefined>;
  setActiveTemplate(id: string): Promise<void>;
  deleteTemplate(id: string): Promise<boolean>;

  /* ---------- Question Configurations ---------- */
  getQuestionConfig(id: string): Promise<QuestionConfig | undefined>;
  createQuestionConfig(config: InsertQuestionConfig): Promise<QuestionConfig>;
  updateQuestionConfig(
    id: string,
    updates: Partial<QuestionConfig>,
  ): Promise<QuestionConfig | undefined>;
  deleteQuestionConfig(id: string): Promise<boolean>;
  getQuestionConfigsByTemplate(templateId: string): Promise<QuestionConfig[]>;
  deleteQuestionConfigsByTemplate(templateId: string): Promise<boolean>;

  /* ---------- Supplementary method ---------- */
  /** Retrieves question definitions; if a `language` column exists it is filtered. */
  getQuestions(lang: string): Promise<QuestionConfig[]>;

  /* ---------- Profiles ---------- */
  // TISZTÍTÁS: A duplikált getProfile() eltávolítva
  getProfileByUserId(userId: string): Promise<Profile | undefined>;
  // --- ÚJ FÜGGVÉNY AZ INTERFACE-BEN ---
  getAllProfiles(): Promise<Profile[]>;
  // --- ÚJ FÜGGVÉNY VÉGE ---
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(
    userId: string,
    updates: Partial<Profile>,
  ): Promise<Profile | undefined>;
  deleteProfile(userId: string): Promise<boolean>;

  /* ---------- Statistics (ÚJ SZEKCIÓ) ---------- */
  getUsersCount(): Promise<number>;
  getProtocolsCount(): Promise<number>;
  getTemplatesCount(): Promise<number>;
  getActiveTemplatesCount(): Promise<number>;
  getRecentProtocols(limit?: number): Promise<Protocol[]>;

  /* ---------- Audit Logs (ÚJ SZEKCIÓ) ---------- */
  createAuditLog(log: InsertAuditLog): Promise<void>;
  getAuditLogs(limit?: number): Promise<any[]>;

  /* ---------- Technician module ---------- */
  getProtocolsByTechnicianId(technicianId: string): Promise<Protocol[]>;
  getTechnicianUsers(): Promise<Profile[]>;
}

// ------------------------------------------------------------
// 3️⃣ DatabaseStorage – concrete implementation (type-safe)
// ------------------------------------------------------------
export class DatabaseStorage implements IStorage {
  /* ---------- Protocols ---------- */
  async getProtocol(id: string) {
    const [protocol] = await (db as any)
      .select()
      .from(protocols)
      .where(eq(protocols.id, id));
    return protocol ?? undefined;
  }

  // ✅ =========================================================
  // === 1. JAVÍTÁS: A HIÁNYZÓ `getProtocols` FÜGGVÉNY HOZZÁADÁSA
  // === (A protocol-mapping.ts hívja meg)
  // =========================================================
  /**
   * Lekérdezi egy adott felhasználó protokolljait lapozva.
   * @param options - userId, page, limit, offset
   * @returns Promise<{ items: Protocol[], total: number }>
   */
  async getProtocols(options: {
    userId: string;
    page: number;
    limit: number;
    offset: number;
  }): Promise<{ items: Protocol[]; total: number }> {
    try {
      console.log(
        `🗄️ Storage: Fetching protocols for user ${options.userId} (Limit: ${options.limit}, Offset: ${options.offset})`,
      );

      const whereClause = eq(protocols.user_id, options.userId);

      // 1. Lekérjük az adott oldal elemeit
      const items = await (db as any)
        .select()
        .from(protocols)
        .where(whereClause)
        .orderBy(desc(protocols.created_at))
        .limit(options.limit)
        .offset(options.offset);

      // 2. Lekérjük a teljes darabszámot (ugyanazzal a szűréssel)
      const [totalResult] = await (db as any)
        .select({ count: sql<number>`count(*)` })
        .from(protocols)
        .where(whereClause);

      const total = Number(totalResult?.count || 0);

      console.log(`✅ Storage: Found ${items.length} items (Total: ${total})`);
      return { items, total };
    } catch (error) {
      console.error("❌ Error in storage.getProtocols:", error);
      return { items: [], total: 0 };
    }
  }

  async createProtocol(protocol: InsertProtocol) {
    const [created] = await (db as any)
      .insert(protocols)
      .values(protocol)
      .returning();
    return created;
  }

  async updateProtocol(id: string, updates: Partial<Protocol>) {
    const [updated] = await (db as any)
      .update(protocols)
      .set(updates)
      .where(eq(protocols.id, id))
      .returning();
    return updated ?? undefined;
  }

  async getAllProtocols() {
    return await (db as any)
      .select()
      .from(protocols)
      .orderBy(desc(protocols.created_at));
  }

  // ✅ =========================================================
  // === 2. JAVÍTÁS: `deleteProtocol` RUGALMASSÁ TÉTELE
  // === userId opcionális - admin override támogatással
  // =========================================================
  /**
   * Egy protokollt töröl.
   * Ha a userId meg van adva, csak akkor töröl, ha ő a tulajdonos (biztonságos user törlés).
   * Ha nincs megadva (admin eset), akkor bármelyiket törli ID alapján.
   * @param id - A törlendő protokoll azonosítója
   * @param userId - (Opcionális) A felhasználó azonosítója ellenőrzéshez
   * @returns Promise<boolean> - true, ha sikeres a törlés
   */
  async deleteProtocol(id: string, userId?: string): Promise<boolean> {
    try {
      console.log(
        `🗑️ Attempting to delete protocol: ${id}${userId ? ` by user: ${userId}` : " (admin override)"}`,
      );

      // Ha van userId, szigorúbb szűrés (biztonsági ellenőrzés)
      // Ha nincs, csak ID alapján törlünk (admin funkció)
      const whereClause = userId
        ? and(eq(protocols.id, id), eq(protocols.user_id, userId))
        : eq(protocols.id, id);

      const result = await (db as any)
        .delete(protocols)
        .where(whereClause)
        .returning();

      const success = result.length > 0;
      if (success) {
        console.log(
          `✅ Protocol ${id} deleted successfully${userId ? ` by user ${userId}` : " (admin)"}`,
        );
      } else {
        console.warn(
          `⚠️ Protocol not found or access denied for deletion (ID: ${id}, User: ${userId || "admin"})`,
        );
      }
      return success;
    } catch (error) {
      console.error(`❌ Error deleting protocol ${id}:`, error);
      return false;
    }
  }

  /* ---------- Templates ---------- */
  async getTemplate(id: string) {
    const [tpl] = await (db as any)
      .select()
      .from(templates)
      .where(eq(templates.id, id));
    return tpl ?? undefined;
  }

  async createTemplate(template: InsertTemplate) {
    const [created] = await (db as any)
      .insert(templates)
      .values(template)
      .returning();
    return created;
  }

  async updateTemplate(id: string, updates: Partial<Template>) {
    const [updated] = await (db as any)
      .update(templates)
      .set(updates)
      .where(eq(templates.id, id))
      .returning();
    return updated ?? undefined;
  }

  async getAllTemplates() {
    return await (db as any)
      .select()
      .from(templates)
      .orderBy(desc(templates.uploaded_at));
  }

  async getActiveTemplate(type: string, language: string) {
    console.log(
      `🔍 Looking for active template – type=${type}, language=${language}`,
    );

    const isActiveCondition = eq(templates.is_active, true);

    let [tpl] = await (db as any)
      .select()
      .from(templates)
      .where(
        and(
          eq(templates.type, type),
          eq(templates.language, language),
          isActiveCondition,
        ),
      );

    if (!tpl) {
      console.log(`🔍 No exact match – trying multilingual`);
      [tpl] = await (db as any)
        .select()
        .from(templates)
        .where(
          and(
            eq(templates.type, type),
            eq(templates.language, "multilingual"),
            isActiveCondition,
          ),
        );
    }

    console.log(`📋 Result: ${tpl ? `${tpl.name} (${tpl.language})` : "none"}`);
    return tpl ?? undefined;
  }

  async setActiveTemplate(id: string) {
    const target = await this.getTemplate(id);
    if (!target) throw new Error("Template not found");

    console.log(
      `Deactivating other templates of type=${target.type}, language=${target.language}`,
    );
    await (db as any)
      .update(templates)
      .set({ is_active: false })
      .where(
        and(
          eq(templates.type, target.type),
          eq(templates.language, target.language),
        ),
      );

    console.log(`Activating template id=${id}`);
    await (db as any)
      .update(templates)
      .set({ is_active: true })
      .where(eq(templates.id, id));

    console.log(`✅ Activated template ${target.name}`);
  }

  async deleteTemplate(id: string) {
    const result = await (db as any)
      .delete(templates)
      .where(eq(templates.id, id))
      .returning();
    return result.length > 0;
  }

  /* ---------- Question Configurations ---------- */
  async getQuestionConfig(id: string) {
    const [cfg] = await (db as any)
      .select()
      .from(questionConfigs)
      .where(eq(questionConfigs.id, id));
    return cfg ?? undefined;
  }

  async createQuestionConfig(config: InsertQuestionConfig) {
    const [created] = await (db as any)
      .insert(questionConfigs)
      .values(config)
      .returning();
    return created;
  }

  async updateQuestionConfig(id: string, updates: Partial<QuestionConfig>) {
    const [updated] = await (db as any)
      .update(questionConfigs)
      .set(updates)
      .where(eq(questionConfigs.id, id))
      .returning();
    return updated ?? undefined;
  }

  async deleteQuestionConfig(id: string) {
    const result = await (db as any)
      .delete(questionConfigs)
      .where(eq(questionConfigs.id, id))
      .returning();
    return result.length > 0;
  }

  async getQuestionConfigsByTemplate(templateId: string) {
    const rawConfigs = await (db as any)
      .select()
      .from(questionConfigs)
      .where(eq(questionConfigs.template_id, templateId))
      .orderBy(questionConfigs.created_at);

    // DEBUG LOG: Nyers adatbázis eredmény
    if (rawConfigs && rawConfigs.length > 0) {
      console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
      console.log("NYERS ADATBÁZIS EREDMÉNY (a konverzió előtt):");
      console.log(JSON.stringify(rawConfigs[0], null, 2));
      console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    }

    // *** JAVÍTOTT, VÉGLEGES CAMELCASE KONVERZIÓ ***
    const configs = rawConfigs.map((config: any) => {
      const newConfig = { ...config };

      // 1. ÁLTALÁNOS: Automatikus snake_case -> camelCase konverzió minden mezőre
      for (const key in newConfig) {
        if (key.includes("_")) {
          const camelCaseKey = key.replace(/_([a-z])/g, (g: string) =>
            g[1].toUpperCase(),
          );
          // Csak akkor hozzuk létre, ha még nem létezik
          if (!(camelCaseKey in newConfig)) {
            newConfig[camelCaseKey] = newConfig[key];
          }
        }
      }

      // 2. MANUÁLIS "BOLONDBIZTOS" FELÜLÍRÁS a kritikus mezőkre
      // A !== undefined ellenőrzés biztosítja, hogy a null értékek is átmásolódjanak
      newConfig.questionId =
        config.question_id !== undefined
          ? config.question_id
          : config.questionId;
      newConfig.cellReference =
        config.cell_reference !== undefined
          ? config.cell_reference
          : config.cellReference;
      newConfig.multiCell =
        config.multi_cell !== undefined
          ? config.multi_cell
          : config.multiCell || false;
      newConfig.titleHu =
        config.title_hu !== undefined ? config.title_hu : config.titleHu;
      newConfig.titleDe =
        config.title_de !== undefined ? config.title_de : config.titleDe;
      newConfig.titleEn =
        config.title_en !== undefined ? config.title_en : config.titleEn;
      newConfig.titleFr =
        config.title_fr !== undefined ? config.title_fr : config.titleFr;
      newConfig.titleIt =
        config.title_it !== undefined ? config.title_it : config.titleIt;
      newConfig.placeholderDe =
        config.placeholder_de !== undefined
          ? config.placeholder_de
          : config.placeholderDe;
      newConfig.placeholderEn =
        config.placeholder_en !== undefined
          ? config.placeholder_en
          : config.placeholderEn;
      newConfig.placeholderFr =
        config.placeholder_fr !== undefined
          ? config.placeholder_fr
          : config.placeholderFr;
      newConfig.placeholderIt =
        config.placeholder_it !== undefined
          ? config.placeholder_it
          : config.placeholderIt;
      newConfig.groupName =
        config.group_name !== undefined ? config.group_name : config.groupName;
      newConfig.groupNameDe =
        config.group_name_de !== undefined
          ? config.group_name_de
          : config.groupNameDe;
      newConfig.groupNameEn =
        config.group_name_en !== undefined
          ? config.group_name_en
          : config.groupNameEn;
      newConfig.groupNameFr =
        config.group_name_fr !== undefined
          ? config.group_name_fr
          : config.groupNameFr;
      newConfig.groupNameIt =
        config.group_name_it !== undefined
          ? config.group_name_it
          : config.groupNameIt;
      newConfig.groupKey =
        config.group_key !== undefined ? config.group_key : config.groupKey;
      newConfig.groupOrder =
        config.group_order !== undefined
          ? config.group_order
          : config.groupOrder || 0;
      newConfig.conditionalGroupKey =
        config.conditional_group_key !== undefined
          ? config.conditional_group_key
          : config.conditionalGroupKey;
      newConfig.minValue =
        config.min_value !== undefined ? config.min_value : config.minValue;
      newConfig.maxValue =
        config.max_value !== undefined ? config.max_value : config.maxValue;
      newConfig.calculationFormula =
        config.calculation_formula !== undefined
          ? config.calculation_formula
          : config.calculationFormula;
      newConfig.calculationInputs =
        config.calculation_inputs !== undefined
          ? config.calculation_inputs
          : config.calculationInputs;
      newConfig.sheetName =
        config.sheet_name !== undefined ? config.sheet_name : config.sheetName;
      newConfig.options =
        config.options !== undefined ? config.options : config.options;
      newConfig.optionCells =
        config.option_cells !== undefined
          ? config.option_cells
          : config.optionCells; // select_extended
      newConfig.defaultIfHidden =
        config.default_if_hidden !== undefined
          ? config.default_if_hidden
          : config.defaultIfHidden; // conditional_group_key
      newConfig.maxLength =
        config.max_length !== undefined ? config.max_length : config.maxLength;

      return newConfig;
    });

    // DEBUG LOG: Konvertált eredmény
    if (configs && configs.length > 0) {
      console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
      console.log("EREDMÉNY a camelCase konverzió UTÁN:");
      console.log(JSON.stringify(configs[0], null, 2));
      console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    }

    console.log(
      `✅ ${configs.length} question configs converted to camelCase.`,
    );
    return configs;
  }

  async deleteQuestionConfigsByTemplate(templateId: string) {
    const result = await (db as any)
      .delete(questionConfigs)
      .where(eq(questionConfigs.template_id, templateId))
      .returning();
    return result.length > 0;
  }

  async getQuestions(lang: string) {
    const hasLanguageColumn = "language" in questionConfigs;
    if (hasLanguageColumn) {
      return await (db as any)
        .select()
        .from(questionConfigs)
        .where(eq((questionConfigs as any).language, lang));
    }
    return await (db as any).select().from(questionConfigs);
  }

  /* ---------- Profiles ---------- */
  // TISZTÍTÁS: A duplikált getProfile() függvény eltávolítva, csak a getProfileByUserId maradt

  async getProfileByUserId(userId: string) {
    const [profile] = await (db as any)
      .select()
      .from(profiles)
      .where(eq(profiles.user_id, userId));
    return profile ?? undefined;
  }

  // --- ÚJ FÜGGVÉNY IMPLEMENTÁCIÓJA ---
  /**
   * Lekérdezi az összes felhasználói profilt az adatbázisból.
   * A legutóbb létrehozott profilok jelennek meg először.
   * @returns Promise<Profile[]>
   */
  async getAllProfiles() {
    try {
      console.log("📋 Fetching all users from Supabase Auth...");

      const { data: authData, error } =
        await supabaseAdmin.auth.admin.listUsers();

      if (error) {
        console.error("❌ Error fetching users from Supabase Auth:", error);
        throw error;
      }

      // Átalakítjuk a "profile" formátumra a kompatibilitás érdekében
      const profiles = authData.users.map((user) => ({
        user_id: user.id,
        full_name:
          user.user_metadata?.full_name || user.email?.split("@")[0] || null,
        email: user.email || null,
        role: user.user_metadata?.role || user.app_metadata?.role || "user",
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
      }));

      console.log(
        `✅ Retrieved ${profiles.length} user profiles from Supabase Auth`,
      );
      return profiles;
    } catch (error) {
      console.error("❌ Error fetching profiles from Auth:", error);
      return [];
    }
  }
  // --- ÚJ FÜGGVÉNY VÉGE ---

  async createProfile(profile: InsertProfile) {
    const [created] = await (db as any)
      .insert(profiles)
      .values(profile)
      .returning();
    return created;
  }

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const [updated] = await (db as any)
      .update(profiles)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(profiles.user_id, userId))
      .returning();
    return updated ?? undefined;
  }

  async deleteProfile(userId: string) {
    console.log(`🗑️ Attempting to delete profile for user: ${userId}`);
    const result = await (db as any)
      .delete(profiles)
      .where(eq(profiles.user_id, userId))
      .returning();

    const success = result.length > 0;
    if (success) {
      console.log(`✅ Profile deleted successfully for user: ${userId}`);
    } else {
      console.warn(`⚠️ No profile found to delete for user: ${userId}`);
    }
    return success;
  }

  /* ---------- Statistics (ÚJ SZEKCIÓ) ---------- */

  /**
   * Visszaadja a regisztrált felhasználók teljes számát.
   * @returns Promise<number>
   */
  async getUsersCount(): Promise<number> {
    try {
      console.log("📊 Counting users from Supabase Auth...");

      const { data, error } = await supabaseAdmin.auth.admin.listUsers();

      if (error) {
        console.error("❌ Error counting users:", error);
        return 0;
      }

      const count = data.users.length;
      console.log(`✅ Total users: ${count}`);
      return count;
    } catch (error) {
      console.error("❌ Error counting users:", error);
      return 0;
    }
  }

  /**
   * Visszaadja a létrehozott protokollok teljes számát.
   * @returns Promise<number>
   */
  async getProtocolsCount(): Promise<number> {
    try {
      console.log("📊 Counting total protocols...");
      const [result] = await (db as any)
        .select({ count: sql<number>`count(*)` })
        .from(protocols);

      const count = Number(result?.count || 0);
      console.log(`✅ Total protocols: ${count}`);
      return count;
    } catch (error) {
      console.error("❌ Error counting protocols:", error);
      return 0;
    }
  }

  /**
   * Visszaadja a feltöltött sablonok teljes számát.
   * @returns Promise<number>
   */
  async getTemplatesCount(): Promise<number> {
    try {
      console.log("📊 Counting total templates...");
      const [result] = await (db as any)
        .select({ count: sql<number>`count(*)` })
        .from(templates);

      const count = Number(result?.count || 0);
      console.log(`✅ Total templates: ${count}`);
      return count;
    } catch (error) {
      console.error("❌ Error counting templates:", error);
      return 0;
    }
  }

  /**
   * Visszaadja az aktív sablonok számát.
   * @returns Promise<number>
   */
  async getActiveTemplatesCount(): Promise<number> {
    try {
      console.log("📊 Counting active templates...");
      const [result] = await (db as any)
        .select({ count: sql<number>`count(*)` })
        .from(templates)
        .where(eq(templates.is_active, true)); // Csak az aktívakat számoljuk

      const count = Number(result?.count || 0);
      console.log(`✅ Active templates: ${count}`);
      return count;
    } catch (error) {
      console.error("❌ Error counting active templates:", error);
      return 0;
    }
  }

  /**
   * Lekérdezi a legutóbbi protokollokat.
   * @param limit - Hány darab protokollt kérünk le (alapértelmezett: 5)
   * @returns Promise<Protocol[]>
   */
  async getRecentProtocols(limit: number = 5): Promise<Protocol[]> {
    try {
      console.log(`📊 Fetching ${limit} most recent protocols...`);
      const recentProtocols = await (db as any)
        .select()
        .from(protocols)
        .orderBy(desc(protocols.created_at))
        .limit(limit);

      console.log(`✅ Retrieved ${recentProtocols.length} recent protocols`);
      return recentProtocols;
    } catch (error) {
      console.error("❌ Error fetching recent protocols:", error);
      return [];
    }
  }

  /* ---------- Audit Logs (JAVÍTOTT VERZIÓ) ---------- */

  /**
   * Új audit log bejegyzés létrehozása.
   * @param log - Az audit log adatai
   * @returns Promise<void>
   */
  async createAuditLog(log: InsertAuditLog): Promise<void> {
    try {
      console.log(
        `📝 Creating audit log: ${log.action} by ${log.user_email || log.user_id}`,
      );

      if (!audit_logs) {
        console.error("❌ audit_logs table not available in schema");
        return;
      }

      await (db as any).insert(audit_logs).values(log);

      console.log(`✅ Audit log created for action: ${log.action}`);
    } catch (error: any) {
      console.error("❌ Error creating audit log:", error?.message || error);
      console.error(
        "❌ Audit log data:",
        JSON.stringify({ action: log.action, user_id: log.user_id }),
      );
    }
  }

  /**
   * 🔥 JAVÍTOTT VERZIÓ - UUID CASTING-GEL
   * Lekérdezi az audit logokat user adatokkal együtt.
   * @param limit - Hány bejegyzést kérünk le (alapértelmezett: 50)
   * @returns Promise<any[]>
   */
  async getAuditLogs(limit: number = 50): Promise<any[]> {
    try {
      console.log(`📜 Fetching last ${limit} audit logs with column fix...`);

      if (!audit_logs) {
        console.error("❌ audit_logs table not available in schema");
        return [];
      }

      // ✅ KIVETTÜK a p.full_name-t, mert nem létezik ez az oszlop
      // ✅ UUID casting (::text) a JOIN-ban
      const result = await (db as any).execute(
        sql`SELECT 
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
              p.email as user_email_joined
            FROM audit_logs al 
            LEFT JOIN profiles p ON al.user_id::text = p.user_id::text 
            ORDER BY al.created_at DESC 
            LIMIT ${limit}`,
      );

      // Drizzle eredmény kezelése
      const rows = Array.isArray(result) ? result : result?.rows || [];

      // Összefésüljük az adatokat
      const mapped = rows.map((row: any) => {
        // Ha nincs név oszlop, generálunk egyet az emailből (pl. "istvan.faddi")
        const fallbackName = row.user_email_joined
          ? row.user_email_joined.split("@")[0]
          : row.user_email
            ? row.user_email.split("@")[0]
            : "Rendszer";

        return {
          id: row.id,
          user_id: row.user_id,
          user_email: row.user_email || row.user_email_joined,
          action: row.action,
          resource_type: row.resource_type,
          resource_id: row.resource_id,
          details: row.details,
          status: row.status,
          error_message: row.error_message,
          ip_address: row.ip_address,
          user_agent: row.user_agent,
          created_at: row.created_at,
          // User objektum a frontend számára
          user: row.user_email_joined
            ? {
                email: row.user_email_joined,
                name: fallbackName, // Email előtti rész névként
              }
            : null,
        };
      });

      console.log(
        `✅ Retrieved ${mapped.length} audit log entries (Safe mode)`,
      );
      return mapped;
    } catch (error: any) {
      console.error("❌ Error fetching audit logs:", error?.message || error);
      console.error("❌ Full error:", error);
      return [];
    }
  }

  // --- Technician module ---
  async getProtocolsByTechnicianId(technicianId: string): Promise<Protocol[]> {
    try {
      const items = await (db as any)
        .select()
        .from(protocols)
        .where(eq(protocols.assigned_technician_id, technicianId))
        .orderBy(desc(protocols.created_at));
      return items;
    } catch (error) {
      console.error("❌ Error in getProtocolsByTechnicianId:", error);
      return [];
    }
  }

  async getTechnicianUsers(): Promise<Profile[]> {
    try {
      const items = await (db as any)
        .select()
        .from(profiles)
        .where(eq(profiles.role, 'technician'))
        .orderBy(profiles.name);
      return items;
    } catch (error) {
      console.error("❌ Error in getTechnicianUsers:", error);
      return [];
    }
  }
}

// ------------------------------------------------------------
// 4️⃣ Exported singleton for convenient imports elsewhere
// ------------------------------------------------------------
export const storage = new DatabaseStorage();
