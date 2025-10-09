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
  // Re-exported table definitions from the db module – this guarantees
  // the exact same type instances the DB was initialised with.
  protocols,
  templates,
  questionConfigs,
} from "./db.js";

import { db } from "./db.js";              // Drizzle connection
import { eq, and, desc } from "drizzle-orm"; // Drizzle helpers

// ------------------------------------------------------------
// 2️⃣ IStorage interface – unchanged
// ------------------------------------------------------------
export interface IStorage {
  /* ---------- Protocols ---------- */
  getProtocol(id: string): Promise<Protocol | undefined>;
  createProtocol(protocol: InsertProtocol): Promise<Protocol>;
  updateProtocol(id: string, updates: Partial<Protocol>): Promise<Protocol | undefined>;
  getAllProtocols(): Promise<Protocol[]>;

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
    
    const isActiveCondition = eq(templates.is_active, 1);
  
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

  // JAVÍTVA: Az SQLite hibát okozó tranzakció helyett két különböző műveletet használunk
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
          const camelCaseKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
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
}

// ------------------------------------------------------------
// 4️⃣ Exported singleton for convenient imports elsewhere
// ------------------------------------------------------------
export const storage = new DatabaseStorage();