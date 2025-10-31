// shared/schema.ts - FRISSÍTETT VERZIÓ (Audit Logs-szal)

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
 * Question configurations – single source of truth for questions
 * ----------------------------------------------------------------------- */

export const QuestionTypeEnum = z.enum([
  "text", 
  "number", 
  "date", 
  "select", 
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
  type: text("type").notNull(),
  required: boolean("required").notNull().default(true),
  placeholder: text("placeholder"),
  cell_reference: text("cell_reference"),
  sheet_name: text("sheet_name").default("Sheet1"),
  multi_cell: boolean("multi_cell").notNull().default(false),
  group_name: text("group_name"),
  group_name_de: text("group_name_de"),
  group_order: integer("group_order").default(0),
  conditional_group_key: text("conditional_group_key"),
  unit: text("unit"),
  min_value: integer("min_value"),
  max_value: integer("max_value"),
  calculation_formula: text("calculation_formula"),
  calculation_inputs: jsonb("calculation_inputs"),
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
 * Audit Logs - Activity tracking for admin operations (ÚJ TÁBLA)
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
  action: text("action").notNull(), // pl. "template.upload", "user.delete"
  resource_type: text("resource_type"), // pl. "template", "user", "protocol"
  resource_id: text("resource_id"), // Az érintett erőforrás ID-ja
  
  // Részletek
  details: jsonb("details"), // További kontextuális információk
  ip_address: text("ip_address"), // Kliens IP címe
  user_agent: text("user_agent"), // Browser információ
  
  // Eredmény
  status: text("status").notNull().default("success"), // "success" | "failure"
  error_message: text("error_message"), // Ha status="failure"
  
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

// --- ÚJ RELÁCIÓK AZ AUDIT LOGS-HOZ ---
export const auditLogsRelations = relations(audit_logs, ({ one }) => ({
  user: one(profiles, {
    fields: [audit_logs.user_id],
    references: [profiles.user_id],
  }),
}));