// shared/schema.ts - JAVÍTOTT VERZIÓ

import { relations, sql } from "drizzle-orm"; // FONTOS: Az `sql` importálása
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
  // JAVÍTVA: .defaultNow() -> .default(sql`CURRENT_TIMESTAMP`)
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
  // JAVÍTVA: .defaultNow() -> .default(sql`CURRENT_TIMESTAMP`)
  uploaded_at: timestamp("uploaded_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  is_active: boolean("is_active").notNull().default(false),
});

export const insertTemplateSchema = createInsertSchema(templates);
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

/* -------------------------------------------------------------------------
 * Question configurations – single source of truth for questions
 * ----------------------------------------------------------------------- */

// === JAVÍTÁS ITT KEZDŐDIK ===
// Bővítettük a Zod sémát az összes új kérdéstípussal, amit az excel-parser-ben is bevezettél.
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
  // Új típusok hozzáadva:
  "textarea", 
  "phone", 
  "email", 
  "time", 
  "multi_select"
]);

// A TypeScript típust most már a Zod sémából származtatjuk, hogy ne kelljen kétszer karbantartani.
export type QuestionType = z.infer<typeof QuestionTypeEnum>;

// === JAVÍTÁS VÉGE ===


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
  type: text("type").notNull(), // Ez a mező most már elfogadja a fenti új típusokat is
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
  // A `created_at` sorod tökéletes, változatlanul hagyva
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertQuestionConfigSchema = createInsertSchema(questionConfigs);
export type QuestionConfig = typeof questionConfigs.$inferSelect;
export type InsertQuestionConfig = typeof questionConfigs.$inferInsert;

// NEW: Extended Question type with localized structure
export interface LocalizedText {
  hu: string;
  de: string;
}

export interface QuestionGroup {
  key: string;
  title: LocalizedText;
}

// Answer value type - can be string, number, boolean, or array
export type AnswerValue = string | number | boolean | string[] | null | undefined;

// Extended Question type with NEW structure and backward compatibility
export type Question = QuestionConfig & {
  // NEW STRUCTURE: Localized title object
  title?: string | LocalizedText;
  
  // NEW STRUCTURE: Group object with key and localized title
  group?: QuestionGroup;
  
  // NEW STRUCTURE: Renamed conditional key
  conditional_key?: string;
  
  // Options for select/radio questions
  options?: string[];
  
  // CAMELCASE ALIASES for backward compatibility with frontend
  questionId?: string;  // alias for question_id
  titleHu?: string;     // alias for title_hu
  titleDe?: string;     // alias for title_de
  groupName?: string;   // alias for group_name
  groupNameDe?: string; // alias for group_name_de
  groupOrder?: number;  // alias for group_order
  groupKey?: string;    // NEW field for group identification
  conditionalGroupKey?: string; // alias for conditional_group_key
  cellReference?: string; // alias for cell_reference
  sheetName?: string;   // alias for sheet_name
  multiCell?: boolean;  // alias for multi_cell
  minValue?: number;    // alias for min_value
  maxValue?: number;    // alias for max_value
  calculationFormula?: string; // alias for calculation_formula
  calculationInputs?: any[];   // alias for calculation_inputs
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