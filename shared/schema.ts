// shared/schema.ts - FRISSÍTETT VERZIÓ (Lift Types + Audit Logs)

import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/* -------------------------------------------------------------------------
 * Protocols
 * ----------------------------------------------------------------------- */
export const protocols = pgTable("protocols", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  reception_date: text("reception_date"),
  language: text("language").notNull(),
  answers: jsonb("answers")
    .notNull()
    .default({} as Record<string, unknown>),
  errors: jsonb("errors").notNull().default([] as unknown[]),
  signature: text("signature"),
  signature_name: text("signature_name"),
  completed: boolean("completed").notNull().default(false),
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(), 
});

export const insertProtocolSchema = createInsertSchema(protocols);
export type Protocol = typeof protocols.$inferSelect;
export type InsertProtocol = typeof protocols.$inferInsert;

/* -------------------------------------------------------------------------
 * Zod schemas / TypeScript types used throughout the project
 * ----------------------------------------------------------------------- */
export const ErrorSeverityEnum = z.enum(["critical", "medium", "low"]);
export type ErrorSeverity = z.infer<typeof ErrorSeverityEnum>;

export const ProtocolErrorSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  severity: ErrorSeverityEnum,
  images: z.array(z.string()).default([]),
});
export type ProtocolError = z.infer<typeof ProtocolErrorSchema>;

/* -------------------------------------------------------------------------
 * Templates
 * ----------------------------------------------------------------------- */
export const templates = pgTable("templates", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  type: text("type").notNull(),
  file_name: text("file_name").notNull(),
  file_path: text("file_path").notNull(),
  language: text("language")
    .notNull()
    .default("multilingual"),
  uploaded_at: timestamp("uploaded_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  is_active: boolean("is_active").notNull().default(false),
});

export const insertTemplateSchema = createInsertSchema(templates);
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

/* -------------------------------------------------------------------------
 * LIFT TYPE SELECTION SYSTEM (ÚJ TÁBLÁK - 2024-11-11)
 * ----------------------------------------------------------------------- */

// LIFT_TYPES - Fő lift kategóriák (MOD, BEX, NEU, EGYEDI)
export const liftTypes = pgTable("lift_types", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(),
  name_hu: text("name_hu").notNull(),
  name_de: text("name_de"),
  description_hu: text("description_hu"),
  description_de: text("description_de"),
  sort_order: integer("sort_order").default(0),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updated_at: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertLiftTypeSchema = createInsertSchema(liftTypes);
export type LiftType = typeof liftTypes.$inferSelect;
export type InsertLiftType = typeof liftTypes.$inferInsert;

// LIFT_SUBTYPES - Alkategóriák (pl. MOD_DR, BEX_GEN2)
export const liftSubtypes = pgTable("lift_subtypes", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  lift_type_id: uuid("lift_type_id")
    .notNull()
    .references(() => liftTypes.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name_hu: text("name_hu").notNull(),
  name_de: text("name_de"),
  description_hu: text("description_hu"),
  description_de: text("description_de"),
  sort_order: integer("sort_order").default(0),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updated_at: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertLiftSubtypeSchema = createInsertSchema(liftSubtypes);
export type LiftSubtype = typeof liftSubtypes.$inferSelect;
export type InsertLiftSubtype = typeof liftSubtypes.$inferInsert;

// LIFT_TEMPLATE_MAPPINGS - Altípus → Template párosítás
export const liftTemplateMappings = pgTable("lift_template_mappings", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  lift_subtype_id: uuid("lift_subtype_id")
    .notNull()
    .references(() => liftSubtypes.id, { onDelete: "cascade" }),
  question_template_id: uuid("question_template_id")
    .references(() => templates.id, { onDelete: "set null" }),
  protocol_template_id: uuid("protocol_template_id")
    .references(() => templates.id, { onDelete: "set null" }),
  is_active: boolean("is_active").default(true).notNull(),
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updated_at: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  created_by: text("created_by"),
  notes: text("notes"),
});

export const insertLiftTemplateMappingSchema = createInsertSchema(liftTemplateMappings);
export type LiftTemplateMapping = typeof liftTemplateMappings.$inferSelect;
export type InsertLiftTemplateMapping = typeof liftTemplateMappings.$inferInsert;

/* -------------------------------------------------------------------------
 * Question configurations – single source of truth for questions
 * ----------------------------------------------------------------------- */

export const QuestionTypeEnum = z.enum([
  "text", 
  "number", 
  "date", 
  "select", 
  "select_extended", // Új: minden opciónak külön cellája van (X/-) 
  "checkbox", 
  "radio", 
  "measurement", 
  "calculated", 
  "true_false", 
  "yes_no_na",
  "textarea", 
  "phone", 
  "email", 
  "time", 
  "multi_select"
]);

export type QuestionType = z.infer<typeof QuestionTypeEnum>;

export const questionConfigs = pgTable("question_configs", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  template_id: uuid("template_id")
    .notNull()
    .references(() => templates.id, { onDelete: 'cascade' }),
  question_id: text("question_id").notNull(),
  title: text("title").notNull(),
  title_hu: text("title_hu"),
  title_de: text("title_de"),
  title_en: text("title_en"),
  title_fr: text("title_fr"),
  title_it: text("title_it"),
  type: text("type").notNull(),
  required: boolean("required").notNull().default(true),
  placeholder: text("placeholder"),
  placeholder_de: text("placeholder_de"),
  placeholder_en: text("placeholder_en"),
  placeholder_fr: text("placeholder_fr"),
  placeholder_it: text("placeholder_it"),
  cell_reference: text("cell_reference"),
  sheet_name: text("sheet_name").default("Sheet1"),
  multi_cell: boolean("multi_cell").notNull().default(false),
  group_name: text("group_name"),
  group_name_de: text("group_name_de"),
  group_name_en: text("group_name_en"),
  group_name_fr: text("group_name_fr"),
  group_name_it: text("group_name_it"),
  group_key: text("group_key"),
  group_order: integer("group_order").default(0),
  conditional_group_key: text("conditional_group_key"),
  unit: text("unit"),
  min_value: integer("min_value"),
  max_value: integer("max_value"),
  calculation_formula: text("calculation_formula"),
  calculation_inputs: jsonb("calculation_inputs"),
  options: text("options"),
  option_cells: text("option_cells"), // select_extended típushoz: cella referenciák (G59,G60,G61,N59,N60,N61)
  default_if_hidden: text("default_if_hidden"), // Alapértelmezett érték rejtett kérdéseknél (conditional_group_key használatakor)
  max_length: integer("max_length"),
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertQuestionConfigSchema = createInsertSchema(questionConfigs);
export type QuestionConfig = typeof questionConfigs.$inferSelect;
export type InsertQuestionConfig = typeof questionConfigs.$inferInsert;

/* -------------------------------------------------------------------------
 * Profiles - User authentication and profile data
 * ----------------------------------------------------------------------- */
export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  user_id: text("user_id").notNull().unique(),
  name: text("name"),
  email: text("email").notNull(),
  address: text("address"),
  google_drive_folder_id: text("google_drive_folder_id"),
  role: text("role").notNull().default("user"),
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updated_at: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

/* -------------------------------------------------------------------------
 * Audit Logs - Activity tracking for admin operations
 * ----------------------------------------------------------------------- */
export const AuditActionEnum = z.enum([
  // User management
  "user.create",
  "user.update",
  "user.delete",
  "user.role_change",
  
  // Template management
  "template.upload",
  "template.activate",
  "template.deactivate",
  "template.delete",
  "template.download",
  
  // Protocol management
  "protocol.create",
  "protocol.update",
  "protocol.delete",
  "protocol.complete",
  
  // Lift type management (ÚJ)
  "lift_type.create",
  "lift_type.update",
  "lift_type.delete",
  "lift_subtype.create",
  "lift_subtype.update",
  "lift_subtype.delete",
  "lift_mapping.create",
  "lift_mapping.update",
  "lift_mapping.activate",
  "lift_mapping.deactivate",
  
  // System
  "admin.login",
  "admin.logout",
  "settings.update",
]);

export type AuditAction = z.infer<typeof AuditActionEnum>;

export const audit_logs = pgTable("audit_logs", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  
  // Ki végezte a műveletet
  user_id: text("user_id").notNull(),
  user_email: text("user_email"),
  
  // Mit csinált
  action: text("action").notNull(),
  resource_type: text("resource_type"),
  resource_id: text("resource_id"),
  
  // Részletek
  details: jsonb("details"),
  ip_address: text("ip_address"),
  user_agent: text("user_agent"),
  
  // Eredmény
  status: text("status").notNull().default("success"),
  error_message: text("error_message"),
  
  // Időbélyeg
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertAuditLogSchema = createInsertSchema(audit_logs);
export type AuditLog = typeof audit_logs.$inferSelect;
export type InsertAuditLog = typeof audit_logs.$inferInsert;

/* -------------------------------------------------------------------------
 * MULTILINGUAL STRUCTURE - Unified language support
 * ----------------------------------------------------------------------- */

export interface LocalizedText {
  hu: string;
  de: string;
}

export interface QuestionGroup {
  key: string;
  title: LocalizedText;
}

export type AnswerValue = string | number | boolean | string[] | null | undefined;

export type Question = QuestionConfig & {
  groupKey?: string;
  group?: QuestionGroup;
  options?: string[];
  optionCells?: string | null; // select_extended: cellák az egyes opciókhoz
  questionId?: string;
  titleHu?: string | null;
  titleDe?: string | null;
  groupName?: string | null;
  groupNameDe?: string | null;
  groupOrder?: number | null;
  conditionalGroupKey?: string | null;
  conditional_group_key?: string | null;
  cellReference?: string | null;
  sheetName?: string | null;
  multiCell?: boolean | null;
  minValue?: number | null;
  maxValue?: number | null;
  calculationFormula?: string | null;
  calculationInputs?: any[] | null;
  unit?: string | null;
  placeholder?: string | null;
  placeholderDe?: string | null;
  required?: boolean;
};

/* -------------------------------------------------------------------------
 * Relations – enables eager loading with Drizzle
 * ----------------------------------------------------------------------- */
export const templatesRelations = relations(templates, ({ many }) => ({
  questionConfigs: many(questionConfigs),
  questionMappings: many(liftTemplateMappings, { 
    relationName: "questionTemplate" 
  }),
  protocolMappings: many(liftTemplateMappings, { 
    relationName: "protocolTemplate" 
  }),
}));

export const questionConfigsRelations = relations(
  questionConfigs,
  ({ one }) => ({
    template: one(templates, {
      fields: [questionConfigs.template_id],
      references: [templates.id],
    }),
  }),
);

// LIFT TYPE RELATIONS (ÚJ)
export const liftTypesRelations = relations(liftTypes, ({ many }) => ({
  subtypes: many(liftSubtypes),
}));

export const liftSubtypesRelations = relations(liftSubtypes, ({ one, many }) => ({
  liftType: one(liftTypes, {
    fields: [liftSubtypes.lift_type_id],
    references: [liftTypes.id],
  }),
  mappings: many(liftTemplateMappings),
}));

export const liftTemplateMappingsRelations = relations(liftTemplateMappings, ({ one }) => ({
  subtype: one(liftSubtypes, {
    fields: [liftTemplateMappings.lift_subtype_id],
    references: [liftSubtypes.id],
  }),
  questionTemplate: one(templates, {
    fields: [liftTemplateMappings.question_template_id],
    references: [templates.id],
    relationName: "questionTemplate",
  }),
  protocolTemplate: one(templates, {
    fields: [liftTemplateMappings.protocol_template_id],
    references: [templates.id],
    relationName: "protocolTemplate",
  }),
}));

// AUDIT LOGS RELATIONS
export const auditLogsRelations = relations(audit_logs, ({ one }) => ({
  user: one(profiles, {
    fields: [audit_logs.user_id],
    references: [profiles.user_id],
  }),
}));