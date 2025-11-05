// shared/schema-sqlite.ts - VÉGLEGES VERZIÓ (user_id és audit_logs hozzáadva)

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
  min_value: real('min_value'), // Changed to real for potentially decimal values
  max_value: real('max_value'), // Changed to real
  calculation_formula: text('calculation_formula'),
  calculation_inputs: text('calculation_inputs', { mode: 'json' }),
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const insertQuestionConfigSchema = createInsertSchema(questionConfigs);
export type QuestionConfig = typeof questionConfigs.$inferSelect;
export type InsertQuestionConfig = typeof questionConfigs.$inferInsert;

export type Question = QuestionConfig;

/* -------------------------------------------------------------------------
 * Audit Logs - SQLite compatible schema (ÚJ)
 * ----------------------------------------------------------------------- */
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

// Templates <-> QuestionConfigs kapcsolat
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

// Protocols <-> Profiles kapcsolat
export const protocolsRelations = relations(protocols, ({ one }) => ({
  user: one(profiles, {
    fields: [protocols.user_id],
    references: [profiles.user_id],
  }),
}));

// Audit Logs <-> Profiles kapcsolat (ÚJ)
export const auditLogsRelations = relations(audit_logs, ({ one }) => ({
  user: one(profiles, {
    fields: [audit_logs.user_id],
    references: [profiles.user_id],
  }),
}));

// Profiles <-> Protocols és Audit Logs kapcsolat (FRISSÍTETT)
export const profilesRelations = relations(profiles, ({ many }) => ({
  protocols: many(protocols),
  audit_logs: many(audit_logs), // Hozzáadva
}));