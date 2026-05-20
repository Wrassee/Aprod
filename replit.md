# OTIS APROD (Acceptance Protocol Document) Application

## Overview
This full-stack TypeScript application digitalizes the OTIS elevator acceptance protocol process. It guides users through a step-by-step questionnaire, enables error documentation with images, generates PDFs, and supports sharing. The system operates in Hungarian, German, English, French and Italian with complete multilingual support, aiming to streamline and standardize the acceptance process, reduce manual errors, and improve efficiency for OTIS technicians. The project envisions a future of fully digitized and seamlessly integrated elevator inspection and acceptance procedures within existing OTIS systems.

**Current version: v0.9.9 - 2026**

## User Preferences
Preferred communication style: Simple, everyday language (Hungarian preferred).
Frustrated with Vite complexity - prefers solutions that avoid Vite whenever possible.
Requires immediate user feedback for all actions - no "silent buttons" or unclear states.
Excel writing functionality must remain untouched to prevent corruption.
Prefers free AI APIs (Groq) over paid solutions.

## Changelog

### v0.9.9 - 2026
- **"Nem → Hiba" feature**: When a `yes_no_na` question gets "Nem" (No) answer, a pulsing red AlertTriangle button appears in that row. Clicking it opens `AddErrorModal` pre-filled with the question title for fast error reporting.
- **`error_reportable` Excel column**: New boolean field in `question_configs` controls which questions show the error-report triangle. Excel template header: `error_reportable` (also accepts `errorReportable`, `hiba_jelolheto`). Default: `false`.
- **`error_reportable` API fix**: The `/api/questions/:language` endpoint was missing this field in its formatted response object. Added `error_reportable: config.errorReportable ?? false` to the return mapping in `routes.ts`.
- **Template upload batch insert**: Replaced the slow for-loop (131 questions × individual DB calls ≈ 13-30 sec) with a single batch `INSERT` call. Fixes Render 30-second request timeout causing false upload errors.
- **Template deletion raw SQL**: Rewrote the delete route with raw SQL (`DELETE FROM question_configs WHERE template_id = ...` then `DELETE FROM templates WHERE id = ...`) instead of Drizzle ORM `.delete().returning()`. Drizzle's RETURNING clause referenced `error_reportable` which was missing from the Render production DB, causing all deletes to fail with 500.
- **Production DB migration**: Applied `ALTER TABLE question_configs ADD COLUMN IF NOT EXISTS error_reportable BOOLEAN NOT NULL DEFAULT false` to the Render/Neon production database.
- **Admin protocol list fix**: `/api/admin/protocols` now uses consistent raw SQL (`SELECT * FROM protocols` + `SELECT count(*)`) avoiding ORM inconsistency that could return `{items:[], total:44}`.
- **Audit log made non-blocking in delete route**: Each step (question_configs delete, file delete, template delete, audit log) wrapped in individual try-catch so a failure in one step does not block the others.

### v0.9.8 - 2026
- Technician module: full repair workflow, role-based routing, assignment management, error status tracking.
- AI-powered Smart Help Wizard: contextual suggestions, FAQ (5 languages), Groq chat, downloadable user manual.
- Digital signature: canvas-based capture with printed name.
- Measurement & calculation question types with automatic error detection.
- Excel Template-Based Niedervolt system.
- Backup & restore via admin panel (downloadable JSON).
- Offline support: service worker, localStorage queue, auto-sync on reconnect.
- Dual PDF generation: LibreOffice (protocol) + jsPDF (error list with Roboto fonts).

## System Architecture
### Frontend
- **Framework**: React with TypeScript.
- **Routing**: Wouter.
- **UI Library**: Shadcn/ui built on Radix UI.
- **Styling**: TailwindCSS with custom OTIS brand colors.
- **State Management**: React hooks and context for local state, with localStorage persistence.
- **Data Fetching**: TanStack Query.
- **Localization**: Complete 5-language support (Hungarian/German/English/French/Italian) using LanguageProvider context and translation objects.
- **UI/UX Decisions**: Mobile-first, tablet-optimized interface with official OTIS branding. Prioritized input stability, debouncing, and a global Map cache for radio button functionality. Advanced save system with visual feedback. Modern calendar date picker with dark glassmorphism style.

### Backend
- **Runtime**: Node.js with TypeScript.
- **Framework**: Express.js.
- **Database**: PostgreSQL with Drizzle ORM (Neon hosted). Dev and production are SEPARATE Neon databases with different `DATABASE_URL` values.
- **File Generation**: Dedicated services for Excel and PDF document creation.
- **API Endpoints**: RESTful API for protocols, templates, and question configurations.
- **AI Integration**: Groq API with llama-3.3-70b-versatile model for interactive help chat.
- **Deployment**: Render.com (production), Replit (development).

### Key Features & Design Patterns
- **Multi-language Support**: 5-language localization (hu/de/en/fr/it) with dynamic switching, using stable `groupKey` slugs. Language selector uses country flag icons with short codes (Hu/De/En/Fr/It).
- **Multilingual Select Options**: Excel template `options` column supports pipe-separated language variants (`Kórház|Krankenhaus|Hospital|Hôpital|Ospedale`). Frontend auto-resolves stored answers to current language. Backend `select_extended` matches against all language variants.
- **Conditional Question Filtering**: Excel-driven visibility control using stable `groupKey` architecture. Supports `conditional_group_key` for dynamic question block visibility, with `defaultIfHidden` for automatic Excel cell population.
- **Mixed-Type Question Blocks**: Flexible rendering supporting any combination of question types. Smart table/card layout logic for `yes_no_na` questions within a block.
- **Error Reportable Questions**: `error_reportable` boolean field per question (set in Excel template). When a `yes_no_na` question marked as reportable gets "Nem" answer, a pulsing red triangle button appears to quickly add an error entry pre-filled with the question title.
- **Template Management System**: Admin interface for uploading, activating, and deleting Excel-based question and protocol templates, supporting unified multilingual templates. Template preview dialog with metadata and question list. Upload uses batch DB insert for speed.
- **Excel Integration**: XML-based manipulation preserving formatting, handling unicode, and supporting complex cell mapping. Calculations handled by Excel's formulas.
- **Dual PDF Generation System**: LibreOffice for protocol PDFs (Excel-to-PDF) and jsPDF for error list PDFs (with embedded Roboto fonts).
- **Data Persistence**: Form data saved to localStorage and PostgreSQL.
- **Offline Support**: Questions and lift types cached in localStorage and service worker. Completed protocols queued in localStorage and auto-synced on network return. Visual offline status bar.
- **Backup & Restore System**: Full database backup/restore via admin panel, creating downloadable JSON. Admin-only access.
- **Error Documentation**: Allows adding, editing, and deleting protocol errors with image attachments.
- **Digital Signature**: Canvas-based signature capture with printed name functionality.
- **Measurement & Calculation**: Supports 'measurement' and 'calculated' question types with a dedicated engine and automatic error detection.
- **Excel Template-Based Niedervolt System**: Dynamic device loading from Excel templates with custom device creation and FI measurement columns.
- **Authentication & Authorization**: Supabase integration for user authentication with role-based access control (admin, technician, user), including user profiles, session management, multilingual login/registration, protected routes, and API security with JWT token validation and Zod validation. Local DB is authoritative for roles; Supabase metadata only overrides for elevated roles.
- **AI-Powered Help System**: Integrated Smart Help Wizard with contextual suggestions, FAQ (5 languages), interactive AI chat (Groq), and downloadable user manual.
- **Technician Module**: Full repair workflow, role-based routing, assignment management, and error status tracking for technicians. Dashboard shows lift identifier (answers['7']), error counts by status, 5-language selector with flag icons.

## Key Database Notes
- `protocols.user_id` column exists in DB but NOT in `shared/schema.ts` — must use raw SQL (`sql` template literals) for user_id filtering in `storage.ts` and `admin-routes.ts`.
- Protocol identifier shown in UI = `answers['7']` (Otis Lift-azonosító field).
- **Dev DB ≠ Production DB**: Replit dev and Render production use SEPARATE Neon databases. Any schema migration (`ALTER TABLE`) must be run on BOTH databases. When adding a new column to `shared/schema.ts`, always also run the corresponding `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` on the production Neon DB directly.
- **Drizzle `.returning()` pitfall**: Drizzle ORM's `.delete().returning()` and `.insert().returning()` generate SQL referencing all schema columns. If a column exists in the schema but not in the production DB, these calls fail with "column does not exist". Prefer raw SQL (`db.execute(sql`...`)`) for critical delete/insert operations in production-facing routes.

## Known URL Encoding Pattern
- Error IDs may contain forward slashes (e.g. `grounding_OK3/1`). Always use `encodeURIComponent(errorId)` in frontend fetch URLs for technician repair PATCH requests.

## Pending Work
- **MOD_HYD PDF AcroForm**: Filling a multi-page AcroForm PDF with protocol answers. Field naming convention in progress: B1_–B14_ blocks, `B3_Ja_3.1.1`/`B3_Nein_3.1.1`/`B3_nz_3.1.1` checkboxes, `B3_fill_A4` for calculated fields. Will be implemented once the full field map is complete.

## External Dependencies
### Frontend
- **React Ecosystem**: `react`, `react-dom`
- **UI Components**: `@radix-ui/react-slot`, `lucide-react`, `class-variance-authority`, `tailwind-merge`
- **Styling**: `tailwindcss`
- **Data Fetching**: `@tanstack/react-query`
- **Date Handling**: `date-fns`
- **Routing**: `wouter`
- **Signature Capture**: `react-signature-canvas`
- **Calendar**: `react-day-picker`
- **Flag Icons**: `react-country-flag` (installed with --legacy-peer-deps due to Capacitor conflict)

### Backend
- **Server Framework**: `express`
- **Database ORM**: `drizzle-orm`, `pg` (node-postgres)
- **Schema Validation**: `zod`
- **File Manipulation**: `adm-zip`, `xml2js`, `simple-excel-js`
- **PDF Generation**: `libreoffice-convert`, `jspdf`
- **Authentication**: `supabase-js`
- **AI Integration**: `openai` (used with Groq API)
- **Utilities**: `nanoid`
