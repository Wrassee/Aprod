# OTIS APROD - Comprehensive Technical Documentation

**Version:** 0.9.5.0  
**Last Updated:** January 13, 2026  
**Language:** English

---

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Database Schema](#4-database-schema)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Backend Architecture](#6-backend-architecture)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Multilingual System](#8-multilingual-system)
9. [Theme System](#9-theme-system)
10. [Template Management](#10-template-management)
11. [Excel Integration](#11-excel-integration)
12. [PDF Generation](#12-pdf-generation)
13. [Email System](#13-email-system)
14. [Lift Type Selection System](#14-lift-type-selection-system)
15. [Questionnaire Module](#15-questionnaire-module)
16. [Niedervolt Measurements](#16-niedervolt-measurements)
17. [Erdungskontrolle (Grounding Control)](#17-erdungskontrolle-grounding-control)
18. [Error Documentation](#18-error-documentation)
19. [Digital Signature](#19-digital-signature)
20. [API Reference](#20-api-reference)
21. [Deployment Guide](#21-deployment-guide)
22. [Development Guide](#22-development-guide)
23. [Version History](#23-version-history)

---

## 1. Application Overview

### What is OTIS APROD?

OTIS APROD (Acceptance Protocol Document) is a full-stack TypeScript Progressive Web Application (PWA) that digitalizes the OTIS elevator acceptance protocol process. The system guides technicians through step-by-step questionnaires, enables error documentation with images, generates Excel and PDF documents, and supports email sharing.

### Core Objectives

- **Digitize paper-based protocols** - Replace manual forms with digital workflow
- **Streamline acceptance process** - Reduce time and errors for OTIS technicians
- **Automated document generation** - Excel and PDF with preserved formatting
- **Complete multilingual support** - Hungarian, German, English, French, Italian
- **Mobile-first design** - Tablet and smartphone optimized interface
- **Offline capability** - LocalStorage persistence for unreliable connections

### Target Users

| User Type | Primary Functions |
|-----------|------------------|
| **OTIS Technicians** | Complete questionnaires, record measurements, document errors |
| **Administrators** | Manage templates, user profiles, system configurations |
| **Managers** | Review PDF reports, analyze data, audit logs |

---

## 2. Technology Stack

### Frontend Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework with TypeScript |
| **Vite** | Build tool and development server |
| **TailwindCSS** | Utility-first CSS framework |
| **Shadcn/ui** | Component library built on Radix UI |
| **TanStack Query v5** | Server state management and caching |
| **Wouter** | Lightweight client-side routing |
| **Capacitor** | Native mobile app wrapper (Android/iOS) |

### Backend Stack

| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime |
| **Express.js** | Web application framework |
| **TypeScript** | Type-safe JavaScript |
| **Drizzle ORM** | Type-safe database ORM |
| **PostgreSQL** | Primary database (Neon serverless) |
| **Supabase** | Authentication and file storage |
| **Zod** | Runtime schema validation |

### Document Generation

| Technology | Purpose |
|------------|---------|
| **ExcelJS** | Excel file manipulation |
| **jsPDF** | PDF generation with Unicode support |
| **pdf-lib** | PDF form filling |
| **LibreOffice** | Excel to PDF conversion (headless) |

### Email & Communication

| Technology | Purpose |
|------------|---------|
| **Nodemailer** | Email transport |
| **Gmail SMTP** | Email delivery service |

---

## 3. Project Structure

```
otis-aprod/
├── src/                          # Frontend source code
│   ├── App.tsx                   # Main application component
│   ├── main.tsx                  # React entry point
│   ├── index.css                 # Global styles and Tailwind config
│   ├── pages/                    # Page components
│   │   ├── start-screen.tsx      # Language selection & entry
│   │   ├── lift-selector.tsx     # Lift type/subtype selection
│   │   ├── questionnaire.tsx     # Main questionnaire flow
│   │   ├── erdungskontrolle.tsx  # Grounding control module
│   │   ├── niedervolt-table.tsx  # Low voltage measurements
│   │   ├── niedervolt-measurements.tsx
│   │   ├── signature.tsx         # Digital signature capture
│   │   ├── completion.tsx        # Protocol completion & export
│   │   ├── protocol-preview.tsx  # PDF/Excel preview
│   │   ├── admin.tsx             # Administration panel
│   │   ├── login.tsx             # Authentication
│   │   ├── forgot-password.tsx   # Password recovery
│   │   ├── reset-password.tsx    # Password reset
│   │   └── auth-callback.tsx     # OAuth callback handler
│   ├── components/               # Reusable components
│   │   ├── ui/                   # Shadcn/ui components
│   │   ├── PageHeader.tsx        # Universal page header
│   │   ├── language-context.tsx  # Language context provider
│   │   ├── isolated-question.tsx # Single question renderer
│   │   ├── measurement-block.tsx # Measurement input block
│   │   ├── calculated-result.tsx # Auto-calculated fields
│   │   ├── error-list.tsx        # Error documentation list
│   │   ├── add-error-modal.tsx   # Error entry dialog
│   │   └── ...
│   ├── contexts/                 # React contexts
│   │   ├── auth-context.tsx      # Authentication state
│   │   └── theme-context.tsx     # Theme management
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-toast.ts          # Toast notifications
│   │   └── use-language.ts       # Language utilities
│   ├── lib/                      # Utility libraries
│   │   ├── translations.ts       # Translation strings (180+ keys)
│   │   ├── queryClient.ts        # TanStack Query configuration
│   │   ├── supabaseClient.ts     # Supabase client
│   │   ├── types.ts              # Frontend type definitions
│   │   └── utils.ts              # Helper functions
│   └── assets/                   # Static assets
│
├── server/                       # Backend source code
│   ├── index.ts                  # Server entry point
│   ├── app.ts                    # Express app configuration
│   ├── routes.ts                 # Main route definitions
│   ├── storage.ts                # Database access layer
│   ├── db.ts                     # Database connection
│   ├── supabaseAdmin.ts          # Supabase admin client
│   ├── routes/                   # Modular route handlers
│   │   ├── admin-routes.ts       # Admin API endpoints
│   │   ├── protocol-mapping.ts   # Protocol operations
│   │   ├── error-routes.ts       # Error management
│   │   ├── lift-types.ts         # Lift type CRUD
│   │   ├── lift-subtypes.ts      # Lift subtype CRUD
│   │   ├── lift-mappings.ts      # Template mappings
│   │   └── lift-available.ts     # Public lift data
│   ├── services/                 # Business logic services
│   │   ├── excel-parser.ts       # Excel template parser
│   │   ├── excel-service.ts      # Excel file generation
│   │   ├── simple-xml-excel.ts   # XML-based Excel manipulation
│   │   ├── pdf-service.ts        # PDF generation (LibreOffice)
│   │   ├── grounding-pdf-service.ts # Grounding PDF forms
│   │   ├── error-export.ts       # Error list PDF export
│   │   ├── email-service.ts      # Email sending
│   │   ├── hybrid-template-loader.ts # Template resolution
│   │   ├── measurement-calculator.ts # Measurement calculations
│   │   ├── niedervolt-service.ts # Niedervolt data processing
│   │   └── supabase-storage.ts   # Cloud file storage
│   ├── middleware/               # Express middleware
│   │   ├── auth.ts               # JWT authentication
│   │   └── audit-logger.ts       # Activity logging
│   ├── config/                   # Configuration files
│   │   ├── grounding-pdf-mapping.ts
│   │   └── local-templates.ts
│   └── utils/                    # Server utilities
│       └── filename-corrections.ts
│
├── shared/                       # Shared code (frontend & backend)
│   ├── schema.ts                 # PostgreSQL schema (Drizzle)
│   ├── schema-sqlite.ts          # SQLite schema (local dev)
│   └── types.ts                  # Shared type definitions
│
├── public/                       # Static files
│   ├── templates/                # Excel templates
│   ├── otis-logo.png            # Application logo
│   └── questions_grounding_*.json # Grounding questions
│
├── scripts/                      # Utility scripts
│   ├── set-admin.ts              # Admin role assignment
│   └── generate-*-questions.ts   # Question generation
│
└── Configuration files
    ├── package.json              # Node.js dependencies
    ├── tsconfig.json             # TypeScript configuration
    ├── vite.config.ts            # Vite build configuration
    ├── tailwind.config.ts        # Tailwind CSS configuration
    ├── drizzle.config.ts         # Drizzle ORM configuration
    └── capacitor.config.ts       # Capacitor mobile config
```

---

## 4. Database Schema

### Core Tables

#### protocols
Stores completed protocol records.

```typescript
protocols = pgTable("protocols", {
  id: uuid("id").primaryKey(),
  reception_date: text("reception_date"),
  language: text("language").notNull(),
  answers: jsonb("answers").notNull().default({}),
  errors: jsonb("errors").notNull().default([]),
  signature: text("signature"),
  signature_name: text("signature_name"),
  completed: boolean("completed").notNull().default(false),
  created_at: timestamp("created_at").default(CURRENT_TIMESTAMP),
});
```

#### templates
Excel template files for questions and protocols.

```typescript
templates = pgTable("templates", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),           // "unified" | "questions" | "protocol"
  file_name: text("file_name").notNull(),
  file_path: text("file_path").notNull(),
  language: text("language").default("multilingual"),
  uploaded_at: timestamp("uploaded_at"),
  is_active: boolean("is_active").default(false),
});
```

#### question_configs
Question definitions parsed from Excel templates.

```typescript
questionConfigs = pgTable("question_configs", {
  id: uuid("id").primaryKey(),
  template_id: uuid("template_id").references(() => templates.id),
  question_id: text("question_id").notNull(),
  title_hu: text("title_hu").notNull(),
  title_de: text("title_de"),
  type: text("type").notNull(),            // QuestionType enum
  required: boolean("required").default(false),
  placeholder: text("placeholder"),
  placeholder_de: text("placeholder_de"),
  cell_reference: text("cell_reference"),   // Excel cell mapping
  sheet_name: text("sheet_name"),
  group_name: text("group_name"),
  group_name_de: text("group_name_de"),
  group_key: text("group_key"),             // Stable slug for filtering
  conditional_group_key: text("conditional_group_key"),
  options: jsonb("options"),
  sort_order: integer("sort_order").default(0),
});
```

### Lift Type System Tables

#### lift_types
Main elevator categories (MOD, BEX, NEU, CUSTOM).

```typescript
liftTypes = pgTable("lift_types", {
  id: uuid("id").primaryKey(),
  code: text("code").notNull().unique(),    // "MOD", "BEX", "NEU", "CUSTOM"
  name_hu: text("name_hu").notNull(),
  name_de: text("name_de"),
  description_hu: text("description_hu"),
  description_de: text("description_de"),
  sort_order: integer("sort_order").default(0),
  is_active: boolean("is_active").default(true),
});
```

#### lift_subtypes
Subcategories linked to lift types.

```typescript
liftSubtypes = pgTable("lift_subtypes", {
  id: uuid("id").primaryKey(),
  lift_type_id: uuid("lift_type_id").references(() => liftTypes.id),
  code: text("code").notNull(),             // "MOD_SEIL", "BEX_GEN2"
  name_hu: text("name_hu").notNull(),
  name_de: text("name_de"),
  sort_order: integer("sort_order").default(0),
  is_active: boolean("is_active").default(true),
});
```

#### lift_template_mappings
Links lift subtypes to question and protocol templates.

```typescript
liftTemplateMappings = pgTable("lift_template_mappings", {
  id: uuid("id").primaryKey(),
  lift_subtype_id: uuid("lift_subtype_id").references(() => liftSubtypes.id),
  question_template_id: uuid("question_template_id").references(() => templates.id),
  protocol_template_id: uuid("protocol_template_id").references(() => templates.id),
  is_active: boolean("is_active").default(true),
  notes: text("notes"),
});
```

### User & Audit Tables

#### profiles
User profile information.

```typescript
profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  user_id: text("user_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  address: text("address"),
  google_drive_folder_id: text("google_drive_folder_id"),
  role: text("role").default("user"),       // "user" | "admin"
  created_at: timestamp("created_at"),
  updated_at: timestamp("updated_at"),
});
```

#### audit_logs
Activity logging for compliance and debugging.

```typescript
auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey(),
  user_id: text("user_id"),
  action: text("action").notNull(),
  entity_type: text("entity_type"),
  entity_id: text("entity_id"),
  details: jsonb("details"),
  ip_address: text("ip_address"),
  user_agent: text("user_agent"),
  timestamp: timestamp("timestamp"),
});
```

---

## 5. Frontend Architecture

### Application Flow

```
StartScreen (Language Selection)
       ↓
    Login
       ↓
LiftSelector (Lift Type/Subtype)
       ↓
Questionnaire (Multi-page form)
       ↓
Erdungskontrolle (Grounding control)
       ↓
NiedervoltTable (Low voltage measurements)
       ↓
Signature (Digital signature capture)
       ↓
Completion (Export & Email)
```

### State Management

1. **React Context**
   - `AuthContext` - User authentication state
   - `ThemeContext` - UI theme (modern/classic)
   - `LanguageContext` - Current language preference

2. **LocalStorage Persistence**
   - Form data: `otis-protocol-formData`
   - Language: `otis-protocol-language`
   - Errors: `otis-protocol-errors`
   - Measurements: `otis-protocol-measurements`

3. **TanStack Query**
   - Server state caching
   - Automatic refetching
   - Optimistic updates

### Key Components

| Component | Purpose |
|-----------|---------|
| `PageHeader` | Consistent header with navigation, progress bar |
| `IsolatedQuestion` | Renders individual questions by type |
| `TrueFalseGroup` | Boolean question groups |
| `MeasurementBlock` | Measurement input with calculations |
| `CalculatedResult` | Auto-computed values |
| `ErrorList` | Error documentation list |
| `AddErrorModal` | Error entry dialog with image upload |

---

## 6. Backend Architecture

### Express Application Structure

```typescript
// server/app.ts
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(sessionMiddleware);

// Route Registration
registerRoutes(app);
```

### Route Organization

| Route Path | Handler | Purpose |
|------------|---------|---------|
| `/api/questions/:language` | `routes.ts` | Get questions by language |
| `/api/protocols/*` | `protocol-mapping.ts` | Protocol CRUD operations |
| `/api/admin/*` | `admin-routes.ts` | Admin functions (protected) |
| `/api/admin/lift-types/*` | `lift-types.ts` | Lift type management |
| `/api/admin/lift-subtypes/*` | `lift-subtypes.ts` | Subtype management |
| `/api/lift-available/*` | `lift-available.ts` | Public lift data |
| `/api/errors/*` | `error-routes.ts` | Error documentation |

### Service Layer

| Service | Responsibility |
|---------|---------------|
| `excel-parser.ts` | Parse questions from Excel templates |
| `simple-xml-excel.ts` | XML-based Excel manipulation (format preservation) |
| `pdf-service.ts` | LibreOffice-based PDF conversion |
| `grounding-pdf-service.ts` | Direct PDF form filling |
| `error-export.ts` | Error list PDF generation |
| `email-service.ts` | SMTP email sending with attachments |
| `hybrid-template-loader.ts` | Template resolution (local → cache → Supabase) |
| `measurement-calculator.ts` | Measurement computations |

---

## 7. Authentication & Authorization

### Supabase Integration

The application uses Supabase for user authentication:

```typescript
// src/contexts/auth-context.tsx
const { data: { user }, error } = await supabase.auth.getUser();
```

### Authentication Flow

1. User enters email/password on login page
2. Supabase validates credentials
3. JWT token stored in session
4. AuthContext provides user state to components
5. Protected routes check authentication status

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| `user` | View own profile, complete protocols |
| `admin` | Full access: manage users, templates, view all data |

### Backend Middleware

```typescript
// server/middleware/auth.ts

// Requires valid JWT token
export const requireAuth = async (req, res, next) => { ... };

// Requires admin role
export const requireAdmin = async (req, res, next) => { ... };

// Requires owner or admin access
export const requireOwnerOrAdmin = async (req, res, next) => { ... };
```

---

## 8. Multilingual System

### Supported Languages

| Code | Language | Coverage |
|------|----------|----------|
| `hu` | Hungarian | 100% |
| `de` | German | 100% |
| `en` | English | 100% |
| `fr` | French | 100% |
| `it` | Italian | 100% |

### Translation Architecture

```typescript
// src/lib/translations.ts
export const translations = {
  title: {
    hu: "OTIS APROD - Átvételi jegyzőkönyv",
    de: "OTIS APROD - Abnahmeprotokoll",
    en: "OTIS APROD - Acceptance Protocol",
    fr: "OTIS APROD - Protocole de réception",
    it: "OTIS APROD - Protocollo di accettazione",
  },
  // 180+ translation keys...
};
```

### Usage in Components

```typescript
const { language, t } = useLanguageContext();

// Simple translation
<h1>{t("title")}</h1>

// Fallback pattern
const title = t("someKey") || "Default Text";
```

### Database Localization

Questions and lift types store translations in separate columns:
- `title_hu`, `title_de` - Question titles
- `name_hu`, `name_de` - Lift type names
- `placeholder`, `placeholder_de` - Input placeholders

### Language Persistence

```typescript
// Saved to localStorage
localStorage.setItem('otis-protocol-language', 'de');

// Loaded on app initialization
const savedLanguage = localStorage.getItem('otis-protocol-language');
```

---

## 9. Theme System

### Available Themes

| Theme | Description |
|-------|-------------|
| `modern` | Glassmorphism effects, gradients, animations |
| `classic` | Traditional enterprise UI, minimal effects |

### Theme Context

```typescript
// src/contexts/theme-context.tsx
const { theme, setTheme } = useTheme();

// Toggle theme
setTheme(theme === 'modern' ? 'classic' : 'modern');
```

### Theme-Aware Components

Components adapt their styling based on active theme:

```tsx
if (theme === 'modern') {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 backdrop-blur-md">
      {/* Modern glassmorphism styling */}
    </div>
  );
}

return (
  <div className="bg-white border border-gray-200">
    {/* Classic clean styling */}
  </div>
);
```

### CSS Classes

```css
/* Applied to body element */
.theme-modern { /* Modern theme active */ }
.theme-classic { /* Classic theme active */ }
```

---

## 10. Template Management

### Template Types

| Type | Purpose |
|------|---------|
| `unified` | Combined questions + protocol template |
| `questions` | Questions-only template |
| `protocol` | Protocol output template |

### Template Loading Strategy

```
1. Check local filesystem (public/templates/)
2. Check in-memory cache
3. Fetch from Supabase Storage
4. Apply filename correction strategies
```

### Admin Template Operations

```typescript
// Upload new template
POST /api/admin/templates
Content-Type: multipart/form-data
Body: { file: File, type: string, language: string }

// Activate template
POST /api/admin/templates/:id/activate

// Delete template
DELETE /api/admin/templates/:id

// Clear cache
POST /api/admin/clear-cache
```

### Excel Template Structure

Templates must follow this column structure:

| Column | Purpose |
|--------|---------|
| question_id | Unique identifier |
| title | Hungarian title |
| titleDE | German title |
| type | Question type |
| cellReference | Target Excel cell(s) |
| groupName | Group display name (HU) |
| groupNameDE | Group display name (DE) |
| groupKey | Stable slug for filtering |
| conditionalGroupKey | Conditional visibility |
| options | Dropdown/radio options |

---

## 11. Excel Integration

### Reading Templates

```typescript
// server/services/excel-parser.ts
const questions = await excelParserService.parseQuestionsFromExcel(filePath);
```

### Writing Data

The system uses XML-based manipulation to preserve original formatting:

```typescript
// server/services/simple-xml-excel.ts
await xmlExcelService.writeFormDataToExcel(
  templatePath,
  outputPath,
  formData,
  cellMappings
);
```

### Cell Reference Formats

| Format | Example | Description |
|--------|---------|-------------|
| Single cell | `B5` | Write to one cell |
| Multiple cells | `A1,B1,C1` | Write same value to multiple |
| Range | `A1:A10` | Write to range |

### Format Preservation

The XML-based approach ensures:
- Original fonts and colors preserved
- Cell formatting intact
- Merged cells respected
- Unicode characters supported

---

## 12. PDF Generation

### Dual PDF System

| Type | Service | Method |
|------|---------|--------|
| Protocol PDF | `pdf-service.ts` | LibreOffice conversion |
| Grounding PDF | `grounding-pdf-service.ts` | Direct PDF form filling |
| Error List PDF | `error-export.ts` | jsPDF with embedded fonts |

### LibreOffice Conversion

```typescript
// server/services/pdf-service.ts
const pdfBuffer = await pdfService.convertExcelToPdf(excelFilePath);
```

### Error List PDF

Supports Unicode (Hungarian/German characters) with embedded Roboto font:

```typescript
// server/services/error-export.ts
const pdf = await errorExportService.generateErrorListPdf(
  errors,
  language,
  protocolId
);
```

### PDF Attachments in Email

```typescript
{
  attachments: {
    protocol: true,    // Include acceptance protocol
    grounding: true,   // Include grounding control
    errorList: false   // Skip error list
  }
}
```

---

## 13. Email System

### Configuration

Uses Nodemailer with Gmail SMTP:

```typescript
// server/services/email-service.ts
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD  // App-specific password
  }
});
```

### Email API

```typescript
POST /api/protocols/:id/send-email
Body: {
  recipient: "user@example.com",
  language: "de",
  attachments: {
    protocol: true,
    grounding: true,
    errorList: true
  }
}
```

### Email Templates

5-language HTML email templates with:
- OTIS branding
- Dynamic attachment listing
- Language-appropriate greetings
- Professional formatting

### Attachment Selection

Users can select which documents to attach:
- Acceptance Protocol PDF
- Grounding Resistance Measurement PDF
- Error List PDF

---

## 14. Lift Type Selection System

### Hierarchy

```
Lift Type (MOD, BEX, NEU, CUSTOM)
    └── Lift Subtype (MOD_SEIL, MOD_HYDRO, BEX_GEN2, etc.)
            └── Template Mapping (Question + Protocol templates)
```

### Frontend Flow

1. User selects lift type (card-based UI)
2. System shows available subtypes
3. User selects subtype
4. System loads mapped templates
5. Questionnaire begins with correct questions

### API Endpoints

```typescript
// Get available lift types and subtypes
GET /api/lift-available

// Admin: Manage lift types
GET/POST/PUT/DELETE /api/admin/lift-types

// Admin: Manage subtypes
GET/POST/PUT/DELETE /api/admin/lift-subtypes/:typeId

// Admin: Manage template mappings
GET/POST/PUT/DELETE /api/admin/lift-mappings
```

### Translation Mapping

For EN/FR/IT languages, frontend provides translations:

```typescript
const liftTypeTranslations = {
  en: { MOD: "Modernization", BEX: "Existing Building", ... },
  fr: { MOD: "Modernisation", BEX: "Bâtiment existant", ... },
  it: { MOD: "Modernizzazione", BEX: "Edificio esistente", ... }
};
```

---

## 15. Questionnaire Module

### Question Types

| Type | Description | Component |
|------|-------------|-----------|
| `text` | Single line text input | TextInput |
| `textarea` | Multi-line text | Textarea |
| `number` | Numeric input | NumberInput |
| `date` | Date picker | DateInput |
| `radio` | Single selection | RadioGroup |
| `checkbox` | Multiple selection | CheckboxGroup |
| `select` | Dropdown menu | Select |
| `true_false` | Yes/No toggle | TrueFalseGroup |
| `yes_no_na` | Yes/No/N.A. | TrueFalseGroup |
| `measurement` | Value + unit input | MeasurementBlock |
| `calculated` | Auto-computed value | CalculatedResult |

### Conditional Filtering

Questions can be conditionally shown/hidden based on other answers:

```typescript
// Question config
{
  groupKey: "treppenhaustur",           // Stable identifier
  conditionalGroupKey: "machine_room"    // Show if machine_room group visible
}
```

### Data Persistence

```typescript
// Auto-save to localStorage on every change
useEffect(() => {
  localStorage.setItem('otis-protocol-formData', JSON.stringify(formData));
}, [formData]);
```

### Validation

- Required field validation
- Type-specific validation (email, phone, number ranges)
- Real-time feedback
- Form-level validation before submission

---

## 16. Niedervolt Measurements

### Purpose

Records low-voltage electrical measurements for elevator systems.

### Device Loading

Devices are dynamically loaded from Excel templates:

```typescript
GET /api/niedervolt/devices/:templateId
```

### Measurement Types

| Measurement | Description |
|-------------|-------------|
| Isolation | Insulation resistance (MΩ) |
| FI Test | Fault current interrupter test (mA) |
| Continuity | Circuit continuity (Ω) |
| Voltage | Operating voltage (V) |

### Data Structure

```typescript
interface MeasurementRow {
  device: string;
  isolation: string;
  fiTest: string;
  notes: string;
}
```

### Excel Mapping

Measurement values are mapped to specific cells in the protocol Excel:

```typescript
// Example mapping
{
  "niedervolt_device_1_isolation": "D45",
  "niedervolt_device_1_fi": "E45"
}
```

---

## 17. Erdungskontrolle (Grounding Control)

### Purpose

Dedicated module for grounding/earthing verification of elevator components.

### Question Groups

| Group | Components Checked |
|-------|-------------------|
| Machine Room | Reference ground, controller, motor, brake |
| Car Top | J-Box, PRS cover, emergency stop, test box |
| Shaft | Guide rails, brackets, door locks, indicators |
| Pit | Buffers, tension pulleys, guide rail anchors |
| Car | Car frame, doors, control panel, lighting |

### Question Data

Stored in JSON files for each language:
- `public/questions_grounding_hu.json`
- `public/questions_grounding_de.json`

### PDF Generation

Uses pdf-lib for direct form filling:

```typescript
// server/services/grounding-pdf-service.ts
const pdfBytes = await groundingPdfService.fillPdfForm(
  templatePath,
  formData,
  language
);
```

---

## 18. Error Documentation

### Error Structure

```typescript
interface ProtocolError {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "medium" | "low";
  images: string[];  // Base64 or URLs
}
```

### Severity Levels

| Level | Color | Description |
|-------|-------|-------------|
| `critical` | Red | Safety-critical issues |
| `medium` | Orange | Important but not critical |
| `low` | Yellow | Minor observations |

### Image Handling

- Camera capture on mobile devices
- File upload on desktop
- Compression for storage efficiency
- Supabase Storage for persistence

### Error List Export

Generates PDF with:
- Error title and description
- Severity indicator
- Attached images (resized)
- Protocol reference

---

## 19. Digital Signature

### Capture Method

Canvas-based signature capture using touch/mouse input:

```typescript
// src/pages/signature.tsx
<SignatureCanvas
  ref={signatureRef}
  penColor="black"
  canvasProps={{ className: 'signature-canvas' }}
/>
```

### Data Storage

- Signature image: Base64-encoded PNG
- Printed name: Text field

### Integration

Signature is embedded in:
- Protocol Excel file
- Generated PDF documents
- Database record

---

## 20. API Reference

### Authentication

```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Questions

```
GET  /api/questions/:language
GET  /api/questions/:language?templateId=:id
```

### Protocols

```
GET    /api/protocols
GET    /api/protocols/:id
POST   /api/protocols
PUT    /api/protocols/:id
DELETE /api/protocols/:id
POST   /api/protocols/:id/complete
POST   /api/protocols/:id/send-email
GET    /api/protocols/:id/download-excel
GET    /api/protocols/:id/download-pdf
```

### Admin - Templates

```
GET    /api/admin/templates
POST   /api/admin/templates
DELETE /api/admin/templates/:id
POST   /api/admin/templates/:id/activate
POST   /api/admin/clear-cache
```

### Admin - Lift Types

```
GET    /api/admin/lift-types
POST   /api/admin/lift-types
PUT    /api/admin/lift-types/:id
DELETE /api/admin/lift-types/:id
```

### Admin - Profiles

```
GET    /api/admin/profiles
GET    /api/admin/profiles/:id
PUT    /api/admin/profiles/:id
```

### Public

```
GET    /api/lift-available
GET    /api/health
```

---

## 21. Deployment Guide

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Email
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# App
NODE_ENV=production
PORT=5000
```

### Replit Deployment

1. Configure secrets in Replit Secrets panel
2. Set up PostgreSQL database (Replit DB)
3. Run `npm run dev` for development
4. Deploy using Replit's built-in deployment

### Render Deployment

```yaml
# render.yaml
services:
  - type: web
    name: otis-aprod
    runtime: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        sync: false
```

### Capacitor (Mobile)

```bash
# Build web assets
npm run build

# Sync to native projects
npx cap sync

# Open in Android Studio
npx cap open android

# Open in Xcode
npx cap open ios
```

---

## 22. Development Guide

### Local Setup

```bash
# Clone repository
git clone <repository-url>
cd otis-aprod

# Install dependencies
npm install

# Start development server
npm run dev

# Database operations
npm run db:push      # Sync schema
npm run db:studio    # Open Drizzle Studio
```

### Code Conventions

1. **TypeScript** - Strict mode enabled
2. **ESLint** - Consistent code style
3. **Component naming** - PascalCase for components
4. **File naming** - kebab-case for files
5. **Imports** - Use `@/` alias for src directory

### Adding a New Language

1. Add language code to `SupportedLanguage` type
2. Add translations to `src/lib/translations.ts`
3. Add flag component to `start-screen.tsx`
4. Update database columns if needed

### Adding a New Question Type

1. Add type to `QuestionTypeEnum` in `shared/schema.ts`
2. Create component in `src/components/`
3. Add case to `IsolatedQuestion` renderer
4. Update Excel parser to handle new type

### Testing

```bash
# Type checking
npm run typecheck

# Build verification
npm run build
```

---

## 23. Version History

### v0.9.5.0 (January 2026) - Current

- Classic theme OTIS logo as home button
- Language indicator dots (uniform styling)
- Email recipient auto-fill from user profile
- Theme-aware email dialog styling

### v0.9.0 (December 2025)

- Email attachment selection system
- 5-language email templates
- Dynamic PDF attachment generation

### v0.8.0 (November 2025)

- Complete 5-language support (HU/DE/EN/FR/IT)
- Login page multilingual
- Admin interface translations

### v0.7.0 (October 2025)

- Lift type selection system
- Template mapping per lift subtype
- Conditional question filtering

### v0.6.0 (September 2025)

- Unified language structure
- Object-based i18n pattern
- groupKey architecture

### v0.5.0 (August 2025)

- Erdungskontrolle module
- Grounding PDF generation
- Template cache management

### v0.4.0 (July 2025)

- Supabase authentication
- Role-based access control
- Audit logging

### v0.3.0 (June 2025)

- Niedervolt measurements
- Measurement calculations
- Excel cell mapping

### v0.2.0 (May 2025)

- Custom file naming (AP_ prefix)
- PDF generation
- Email integration

### v0.1.0 (April 2025)

- Initial release
- Basic questionnaire flow
- Excel template support
- HU/DE languages

---

## Support & Contact

For technical support or feature requests, please contact the development team.

**OTIS Elevator Company**  
*Made to move you™*

---

*This documentation was generated for OTIS APROD v0.9.5.0*
