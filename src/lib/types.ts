import { Question, ProtocolError, ErrorSeverity } from "../../shared/schema.js";

export type AnswerValue = string | number | boolean | null;
export interface MeasurementRow {
  id: string;
  measurementType: string;
  description: string;
  value1: string;
  value2: string;
  value3: string;
  unit: string;
  notes: string;
}

export interface FormData {
  receptionDate: string;
  answers: Record<string, AnswerValue>;
  errors: ProtocolError[];
  signature?: string;
  signatureName?: string;
  niedervoltMeasurements?: MeasurementRow[];
  niedervoltTableMeasurements?: Record<string, any>;
  groundingCheckAnswers?: Record<string, boolean>;
}

export interface QuestionPage {
  title: string;
  questions: Question[];
}

export interface AppState {
  currentScreen: 'start' | 'questionnaire' | 'signature' | 'completion';
  language: 'hu' | 'de';
  currentPage: number;
  totalPages: number;
  formData: FormData;
  isSubmitting: boolean;
}

export interface ImageUpload {
  file: File;
  preview: string;
  uploaded?: boolean;
}
