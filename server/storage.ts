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

import { db } from "./db.js";              // Drizzle connection
import { eq, and, desc, sql } from "drizzle-orm"; // Drizzle helpers + sql for aggregations

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
  }): Promise<{ items: Protocol[]; total: number; }>;
  createProtocol(protocol: InsertProtocol): Promise<Protocol>;
  updateProtocol(id: string, updates: Partial<Protocol>): Promise<Protocol | undefined>;
  getAllProtocols(): Promise<Protocol[]>;
  // ✅ JAVÍTÁS: A deleteProtocol már a user_id-t is kéri a biztonságos törléshez
  deleteProtocol(id: string, userId: string): Promise<boolean>;

  /* ---------- Templates ---------- */
  getTemplate(id: string): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: string, updates: Partial<Template>): Promise<Template | undefined>;
  getAllTemplates(): Promise<Template[]>;
  getActiveTemplate(type: string, language: string): Promise<Template | undefined>;
  setActiveTemplate(id: string): Promise<void>;
  deleteTemplate(id: string): Promise<boolean>;

  /* ---------- Question Configurations ---------- */
  getQuestionConfig(id: string): Promise<QuestionConfig | undefined>;
  createQuestionConfig(config: InsertQuestionConfig): Promise<QuestionConfig>;
  updateQuestionConfig(id: string, updates: Partial<QuestionConfig>): Promise<QuestionConfig | undefined>;
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
  updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | undefined>;
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
}

// ------------------------------------------------------------
// 3️⃣ DatabaseStorage – concrete implementation (type-safe)
// ------------------------------------------------------------
export class DatabaseStorage implements IStorage {
  /* ---------- Protocols ---------- */
  async getProtocol(id: string) {
    const [protocol] = await (db as any).select().from(protocols).where(eq(protocols.id, id));
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
  }): Promise<{ items: Protocol[]; total: number; }> {
    
    try {
      console.log(`🗄️ Storage: Fetching protocols for user ${options.userId} (Limit: ${options.limit}, Offset: ${options.offset})`);
      
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
      console.error('❌ Error in storage.getProtocols:', error);
      return { items: [], total: 0 };
    }
  }

  async createProtocol(protocol: InsertProtocol) {
    const [created] = await (db as any).insert(protocols).values(protocol).returning();
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
    return await (db as any).select().from(protocols).orderBy(desc(protocols.created_at));
  }

  // ✅ =========================================================
  // === 2. JAVÍTÁS: `deleteProtocol` BIZTONSÁGOSSÁ TÉTELE
  // === (A protocol-mapping.ts hívja meg)
  // =========================================================
  /**
  * Egy protokollt töröl, de csak akkor, ha a user_id egyezik.
  * @param id - A törlendő protokoll azonosítója
  * @param userId - A felhasználó (tulajdonos) azonosítója
  * @returns Promise<boolean> - true, ha sikeres a törlés
  */
  async deleteProtocol(id: string, userId: string): Promise<boolean> {
    try {
      console.log(`🗑️ Attempting to delete protocol: ${id} by user: ${userId}`);
      
      // Biztonsági ellenőrzés: Csak a saját protokollját törölhesse
      const whereClause = and(
        eq(protocols.id, id),
        eq(protocols.user_id, userId)
      );

      const result = await (db as any)
        .delete(protocols)
        .where(whereClause) // Csak ott töröl, ahol az ID ÉS a user_id is egyezik
        .returning();
      
      const success = result.length > 0;
      if (success) {
        console.log(`✅ Protocol ${id} deleted successfully by user ${userId}`);
      } else {
        console.warn(`⚠️ No protocol found with ID: ${id} owned by user: ${userId}`);
      }
      return success;
    } catch (error) {
      console.error(`❌ Error deleting protocol ${id}:`, error);
      return false;
    }
  }

  /* ---------- Templates ---------- */
  async getTemplate(id: string) {
    const [tpl] = await (db as any).select().from(templates).where(eq(templates.id, id));
    return tpl ?? undefined;
  }

  async createTemplate(template: InsertTemplate) {
    const [created] = await (db as any).insert(templates).values(template).returning();
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
    return await (db as any).select().from(templates).orderBy(desc(templates.uploaded_at));
  }

  async getActiveTemplate(type: string, language: string) {
    console.log(`🔍 Looking for active template – type=${type}, language=${language}`);
    
    const isActiveCondition = eq(templates.is_active, true);
  
    let [tpl] = await (db as any)
      .select()
      .from(templates)
      .where(and(eq(templates.type, type), eq(templates.language, language), isActiveCondition));
  
    if (!tpl) {
      console.log(`🔍 No exact match – trying multilingual`);
      [tpl] = await (db as any)
        .select()
        .from(templates)
        .where(and(eq(templates.type, type), eq(templates.language, "multilingual"), isActiveCondition));
    }
  
    console.log(`📋 Result: ${tpl ? `${tpl.name} (${tpl.language})` : "none"}`);
    return tpl ?? undefined;
  }

  async setActiveTemplate(id: string) {
    const target = await this.getTemplate(id);
    if (!target) throw new Error("Template not found");

    console.log(`Deactivating other templates of type=${target.type}, language=${target.language}`);
    await (db as any)
        .update(templates)
        .set({ is_active: false })
        .where(and(eq(templates.type, target.type), eq(templates.language, target.language)));

    console.log(`Activating template id=${id}`);
    await (db as any)
        .update(templates)
        .set({ is_active: true })
        .where(eq(templates.id, id));

    console.log(`✅ Activated template ${target.name}`);
  }

  async deleteTemplate(id: string) {
    const result = await (db as any).delete(templates).where(eq(templates.id, id)).returning();
    return result.length > 0;
  }

  /* ---------- Question Configurations ---------- */
  async getQuestionConfig(id: string) {
    const [cfg] = await (db as any).select().from(questionConfigs).where(eq(questionConfigs.id, id));
    return cfg ?? undefined;
  }

  async createQuestionConfig(config: InsertQuestionConfig) {
    const [created] = await (db as any).insert(questionConfigs).values(config).returning();
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
    const result = await (db as any).delete(questionConfigs).where(eq(questionConfigs.id, id)).returning();
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
      console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
      console.log('NYERS ADATBÁZIS EREDMÉNY (a konverzió előtt):');
      console.log(JSON.stringify(rawConfigs[0], null, 2));
      console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    }

    // *** JAVÍTOTT, VÉGLEGES CAMELCASE KONVERZIÓ ***
    const configs = rawConfigs.map((config: any) => {
      const newConfig = { ...config };
      
      // 1. ÁLTALÁNOS: Automatikus snake_case -> camelCase konverzió minden mezőre
      for (const key in newConfig) {
        if (key.includes('_')) {
          const camelCaseKey = key.replace(/_([a-z])/g, (g: string) => g[1].toUpperCase());
          // Csak akkor hozzuk létre, ha még nem létezik
          if (!(camelCaseKey in newConfig)) {
            newConfig[camelCaseKey] = newConfig[key];
          }
        }
      }
      
      // 2. MANUÁLIS "BOLONDBIZTOS" FELÜLÍRÁS a kritikus mezőkre
      // A !== undefined ellenőrzés biztosítja, hogy a null értékek is átmásolódjanak
      newConfig.questionId = config.question_id !== undefined ? config.question_id : config.questionId;
      newConfig.cellReference = config.cell_reference !== undefined ? config.cell_reference : config.cellReference;
      newConfig.multiCell = config.multi_cell !== undefined ? config.multi_cell : (config.multiCell || false);
      newConfig.titleHu = config.title_hu !== undefined ? config.title_hu : config.titleHu;
      newConfig.titleDe = config.title_de !== undefined ? config.title_de : config.titleDe;
      newConfig.groupName = config.group_name !== undefined ? config.group_name : config.groupName;
      newConfig.groupNameDe = config.group_name_de !== undefined ? config.group_name_de : config.groupNameDe;
      newConfig.groupOrder = config.group_order !== undefined ? config.group_order : (config.groupOrder || 0);
      newConfig.conditionalGroupKey = config.conditional_group_key !== undefined ? config.conditional_group_key : config.conditionalGroupKey;
      newConfig.minValue = config.min_value !== undefined ? config.min_value : config.minValue;
      newConfig.maxValue = config.max_value !== undefined ? config.max_value : config.maxValue;
      newConfig.calculationFormula = config.calculation_formula !== undefined ? config.calculation_formula : config.calculationFormula;
      newConfig.calculationInputs = config.calculation_inputs !== undefined ? config.calculation_inputs : config.calculationInputs;
      newConfig.sheetName = config.sheet_name !== undefined ? config.sheet_name : config.sheetName;

      return newConfig;
    });

    // DEBUG LOG: Konvertált eredmény
    if (configs && configs.length > 0) {
      console.log('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<');
      console.log('EREDMÉNY a camelCase konverzió UTÁN:');
      console.log(JSON.stringify(configs[0], null, 2));
      console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
    }

    console.log(`✅ ${configs.length} question configs converted to camelCase.`);
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
    const [profile] = await (db as any).select().from(profiles).where(eq(profiles.user_id, userId));
    return profile ?? undefined;
  }
  
  // --- ÚJ FÜGGVÉNY IMPLEMENTÁCIÓJA ---
  /**
   * Lekérdezi az összes felhasználói profilt az adatbázisból.
   * A legutóbb létrehozott profilok jelennek meg először.
   * @returns Promise<Profile[]>
   */
  async getAllProfiles() {
    console.log('📋 Fetching all user profiles from database...');
    const profiles_list = await (db as any)
      .select()
      .from(profiles)
      .orderBy(desc(profiles.created_at));
    
    console.log(`✅ Retrieved ${profiles_list.length} user profiles`);
    return profiles_list;
  }
  // --- ÚJ FÜGGVÉNY VÉGE ---

  async createProfile(profile: InsertProfile) {
    const [created] = await (db as any).insert(profiles).values(profile).returning();
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
      console.log('📊 Counting total users...');
      const [result] = await (db as any)
        .select({ count: sql<number>`count(*)` })
        .from(profiles);
      
      const count = Number(result?.count || 0);
      console.log(`✅ Total users: ${count}`);
      return count;
    } catch (error) {
      console.error('❌ Error counting users:', error);
      return 0;
    }
  }

  /**
   * Visszaadja a létrehozott protokollok teljes számát.
   * @returns Promise<number>
   */
  async getProtocolsCount(): Promise<number> {
    try {
      console.log('📊 Counting total protocols...');
      const [result] = await (db as any)
        .select({ count: sql<number>`count(*)` })
        .from(protocols);
      
      const count = Number(result?.count || 0);
      console.log(`✅ Total protocols: ${count}`);
      return count;
    } catch (error) {
      console.error('❌ Error counting protocols:', error);
      return 0;
    }
  }

  /**
   * Visszaadja a feltöltött sablonok teljes számát.
   * @returns Promise<number>
   */
  async getTemplatesCount(): Promise<number> {
    try {
      console.log('📊 Counting total templates...');
      const [result] = await (db as any)
        .select({ count: sql<number>`count(*)` })
        .from(templates);
      
      const count = Number(result?.count || 0);
      console.log(`✅ Total templates: ${count}`);
      return count;
    } catch (error) {
      console.error('❌ Error counting templates:', error);
      return 0;
    }
  }

  /**
   * Visszaadja az aktív sablonok számát.
   * @returns Promise<number>
   */
  async getActiveTemplatesCount(): Promise<number> {
    try {
      console.log('📊 Counting active templates...');
      const [result] = await (db as any)
        .select({ count: sql<number>`count(*)` })
        .from(templates)
        .where(eq(templates.is_active, true)); // Csak az aktívakat számoljuk
      
      const count = Number(result?.count || 0);
      console.log(`✅ Active templates: ${count}`);
      return count;
    } catch (error) {
      console.error('❌ Error counting active templates:', error);
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
      console.error('❌ Error fetching recent protocols:', error);
      return [];
    }
  }

  /* ---------- Audit Logs (ÚJ SZEKCIÓ) ---------- */

  /**
   * Új audit log bejegyzés létrehozása.
   * @param log - Az audit log adatai
   * @returns Promise<void>
   */
  async createAuditLog(log: InsertAuditLog): Promise<void> {
    try {
      console.log(`📝 Creating audit log: ${log.action} by ${log.user_email || log.user_id}`);
      
      await (db as any).insert(audit_logs).values(log);
      
      console.log(`✅ Audit log created for action: ${log.action}`);
    } catch (error) {
      console.error('❌ Error creating audit log:', error);
      // NEM dobunk hibát tovább, mert a naplózás hibája nem akaszthatja meg a fő műveletet
    }
  }

  /**
   * Audit log bejegyzések lekérdezése felhasználói adatokkal együtt.
   * Használja a Drizzle ORM relációs lekérdezését a user adatok automatikus JOIN-jához.
   * @param limit - A lekérdezendő bejegyzések száma (alapértelmezett: 50)
   * @returns Promise<AuditLog[]>
   */
  async getAuditLogs(limit: number = 50): Promise<any[]> {
    try {
      console.log(`📜 Fetching last ${limit} audit logs with user data...`);
      
      const logs = await (db as any).query.audit_logs.findMany({
        orderBy: [desc(audit_logs.created_at)],
        limit: limit,
        // A 'with' kulcsszó segítségével a Drizzle automatikusan JOIN-olja
        // a felhasználói adatokat a 'schema.ts'-ben definiált 'auditLogsRelations' alapján.
        with: {
          user: {
            columns: {
              email: true,
              name: true,
            },
          },
        },
      });
      
      console.log(`✅ Retrieved ${logs.length} audit log entries with user data`);
      return logs;
    } catch (error) {
      console.error('❌ Error fetching audit logs:', error);
      return [];
    }
  }
}

// ------------------------------------------------------------
// 4️⃣ Exported singleton for convenient imports elsewhere
// ------------------------------------------------------------
export const storage = new DatabaseStorage();