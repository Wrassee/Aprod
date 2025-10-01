// shared/schema-sqlite.ts - VÉGLEGES VERZIÓ

import { relations, sql } from 'drizzle-orm'; // FONTOS: Az `sql` importálása
import {
  sqliteTable,
  text,
  integer,
} from 'drizzle-orm/sqlite-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

/* -------------------------------------------------------------------------
 * Protocols - SQLite compatible schema
 * ----------------------------------------------------------------------- */
export const protocols = sqliteTable('protocols', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  reception_date: text('reception_date'),
  language: text('language').notNull(),
  answers: text('answers', { mode: 'json' }).notNull().default('{}'),
  errors: text('errors', { mode: 'json' }).notNull().default('[]'),
  signature: text('signature'),
  signature_name: text('signature_name'),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  // JAVÍTVA: JavaScript default helyett SQL default
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
  // JAVÍTVA: JavaScript default helyett SQL default
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
  min_value: integer('min_value'),
  max_value: integer('max_value'),
  calculation_formula: text('calculation_formula'),
  calculation_inputs: text('calculation_inputs', { mode: 'json' }),
  // JAVÍTVA: JavaScript default helyett SQL default
  created_at: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const insertQuestionConfigSchema = createInsertSchema(questionConfigs);
export type QuestionConfig = typeof questionConfigs.$inferSelect;
export type InsertQuestionConfig = typeof questionConfigs.$inferInsert;

export type Question = QuestionConfig;

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