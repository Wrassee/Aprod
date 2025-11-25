// shared/schema-sqlite.ts - VÉGLEGES VERZIÓ (Lift Types hozzáadva)

import { relations, sql } from 'drizzle-orm';
import {
  sqliteTable,
  text,
  integer,
  real,
} from 'drizzle-orm/sqlite-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

/* -------------------------------------------------------------------------
 * Profiles - User authentication and profile data (SQLite)
 * FONTOS: Ezt kell először definiálni, hogy a protocols hivatkozhasson rá
 * ----------------------------------------------------------------------- */
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: text('user_id').notNull().unique(),
  name: text('name'),
  email: text('email').notNull(),
  address: text('address'),
  google_drive_folder_id: text('google_drive_folder_id'),
  role: text('role').notNull().default('user'),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updated_at: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

/* -------------------------------------------------------------------------
 * Protocols - SQLite compatible schema
 * ✅ JAVÍTVA: user_id hozzáadva
 * ----------------------------------------------------------------------- */
export const protocols = sqliteTable('protocols', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: text('user_id').notNull().references(() => profiles.user_id, { onDelete: 'cascade' }),
  reception_date: text('reception_date'),
  language: text('language').notNull(),
  answers: text('answers', { mode: 'json' }).notNull().default('{}'),
  errors: text('errors', { mode: 'json' }).notNull().default('[]'),
  signature: text('signature'),
  signature_name: text('signature_name'),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
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
 * Templates - SQLite compatible schema
 * ----------------------------------------------------------------------- */
export const templates = sqliteTable('templates', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  type: text('type').notNull(),
  file_name: text('file_name').notNull(),
  file_path: text('file_path').notNull(),
  language: text('language').notNull().default('multilingual'),
  uploaded_at: integer('uploaded_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  is_active: integer('is_active', { mode: 'boolean' }).notNull().default(false),
});

export const insertTemplateSchema = createInsertSchema(templates);
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

/* -------------------------------------------------------------------------
 * LIFT TYPE SELECTION SYSTEM (ÚJ TÁBLÁK - 2024-11-14) - SQLite
 * ----------------------------------------------------------------------- */

// LIFT_TYPES - Fő lift kategóriák (MOD, BEX, NEU, EGYEDI)
export const liftTypes = sqliteTable("lift_types", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text("code").notNull().unique(),
  name_hu: text("name_hu").notNull(),
  name_de: text("name_de"),
  description_hu: text("description_hu"),
  description_de: text("description_de"),
  sort_order: integer("sort_order").default(0),
  is_active: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updated_at: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const insertLiftTypeSchema = createInsertSchema(liftTypes);
export type LiftType = typeof liftTypes.$inferSelect;
export type InsertLiftType = typeof liftTypes.$inferInsert;

// LIFT_SUBTYPES - Alkategóriák (pl. MOD_DR, BEX_GEN2)
export const liftSubtypes = sqliteTable("lift_subtypes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  lift_type_id: text("lift_type_id")
    .notNull()
    .references(() => liftTypes.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name_hu: text("name_hu").notNull(),
  name_de: text("name_de"),
  description_hu: text("description_hu"),
  description_de: text("description_de"),
  sort_order: integer("sort_order").default(0),
  is_active: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updated_at: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const insertLiftSubtypeSchema = createInsertSchema(liftSubtypes);
export type LiftSubtype = typeof liftSubtypes.$inferSelect;
export type InsertLiftSubtype = typeof liftSubtypes.$inferInsert;

// LIFT_TEMPLATE_MAPPINGS - Altípus → Template párosítás
export const liftTemplateMappings = sqliteTable("lift_template_mappings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  lift_subtype_id: text("lift_subtype_id")
    .notNull()
    .references(() => liftSubtypes.id, { onDelete: "cascade" }),
  question_template_id: text("question_template_id")
    .references(() => templates.id, { onDelete: "set null" }),
  protocol_template_id: text("protocol_template_id")
    .references(() => templates.id, { onDelete: "set null" }),
  is_active: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  created_at: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updated_at: integer("updated_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
  created_by: text("created_by"),
  notes: text("notes"),
});

export const insertLiftTemplateMappingSchema = createInsertSchema(liftTemplateMappings);
export type LiftTemplateMapping = typeof liftTemplateMappings.$inferSelect;
export type InsertLiftTemplateMapping = typeof liftTemplateMappings.$inferInsert;

/* -------------------------------------------------------------------------
 * Question configurations – single source of truth for questions
 * ----------------------------------------------------------------------- */
export const questionConfigs = sqliteTable('question_configs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  template_id: text('template_id').notNull().references(() => templates.id, { onDelete: 'cascade' }),
  question_id: text('question_id').notNull(),
  title: text('title').notNull(),
  title_hu: text('title_hu'),
  title_de: text('title_de'),
  type: text('type').notNull(),
  required: integer('required', { mode: 'boolean' }).notNull().default(true),
  placeholder: text('placeholder'),
  cell_reference: text('cell_reference'),
  sheet_name: text('sheet_name').default('Sheet1'),
  multi_cell: integer('multi_cell', { mode: 'boolean' }).notNull().default(false),
  group_name: text('group_name'),
  group_name_de: text('group_name_de'),
  group_order: integer('group_order').default(0),
  conditional_group_key: text('conditional_group_key'),
  unit: text('unit'),
  min_value: real('min_value'),
  max_value: real('max_value'),
  calculation_formula: text('calculation_formula'),
  calculation_inputs: text('calculation_inputs', { mode: 'json' }),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const insertQuestionConfigSchema = createInsertSchema(questionConfigs);
export type QuestionConfig = typeof questionConfigs.$inferSelect;
export type InsertQuestionConfig = typeof questionConfigs.$inferInsert;

export type Question = QuestionConfig;

/* -------------------------------------------------------------------------
 * Audit Logs - SQLite compatible schema
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

export const audit_logs = sqliteTable('audit_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  user_id: text('user_id').notNull(),
  user_email: text('user_email'),
  action: text('action').notNull(),
  resource_type: text('resource_type'),
  resource_id: text('resource_id'),
  details: text('details', { mode: 'json' }),
  ip_address: text('ip_address'),
  user_agent: text('user_agent'),
  status: text('status').notNull().default('success'),
  error_message: text('error_message'),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export type AuditLog = typeof audit_logs.$inferSelect;
export type InsertAuditLog = typeof audit_logs.$inferInsert;

/* -------------------------------------------------------------------------
 * Relations – enables eager loading with Drizzle
 * ----------------------------------------------------------------------- */

// Templates <-> QuestionConfigs + Lift Mappings kapcsolat (FRISSÍTETT)
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

// Protocols <-> Profiles kapcsolat
export const protocolsRelations = relations(protocols, ({ one }) => ({
  user: one(profiles, {
    fields: [protocols.user_id],
    references: [profiles.user_id],
  }),
}));

// Audit Logs <-> Profiles kapcsolat
export const auditLogsRelations = relations(audit_logs, ({ one }) => ({
  user: one(profiles, {
    fields: [audit_logs.user_id],
    references: [profiles.user_id],
  }),
}));

// Profiles <-> Protocols és Audit Logs kapcsolat
export const profilesRelations = relations(profiles, ({ many }) => ({
  protocols: many(protocols),
  audit_logs: many(audit_logs),
}));