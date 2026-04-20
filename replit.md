# OTIS APROD (Acceptance Protocol Document) Application

## Overview
This full-stack TypeScript application digitalizes the OTIS elevator acceptance protocol process. It guides users through a step-by-step questionnaire, enables error documentation with images, generates PDFs, and supports sharing. The system operates in Hungarian, German, English, French and Italian with complete multilingual support, aiming to streamline and standardize the acceptance process, reduce manual errors, and improve efficiency for OTIS technicians. The project envisions a future of fully digitized and seamlessly integrated elevator inspection and acceptance procedures within existing OTIS systems.

**Current version: v0.9.8 - 2026**

## User Preferences
Preferred communication style: Simple, everyday language (Hungarian preferred).
Frustrated with Vite complexity - prefers solutions that avoid Vite whenever possible.
Requires immediate user feedback for all actions - no "silent buttons" or unclear states.
Excel writing functionality must remain untouched to prevent corruption.
Prefers free AI APIs (Groq) over paid solutions.

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
- **Database**: PostgreSQL with Drizzle ORM (Supabase hosted).
- **File Generation**: Dedicated services for Excel and PDF document creation.
- **API Endpoints**: RESTful API for protocols, templates, and question configurations.
- **AI Integration**: Groq API with llama-3.3-70b-versatile model for interactive help chat.

### Key Features & Design Patterns
- **Multi-language Support**: 5-language localization (hu/de/en/fr/it) with dynamic switching, using stable `groupKey` slugs. Language selector uses country flag icons with short codes (Hu/De/En/Fr/It).
- **Multilingual Select Options**: Excel template `options` column supports pipe-separated language variants (`Kórház|Krankenhaus|Hospital|Hôpital|Ospedale`). Frontend auto-resolves stored answers to current language. Backend `select_extended` matches against all language variants.
- **Conditional Question Filtering**: Excel-driven visibility control using stable `groupKey` architecture. Supports `conditional_group_key` for dynamic question block visibility, with `defaultIfHidden` for automatic Excel cell population.
- **Mixed-Type Question Blocks**: Flexible rendering supporting any combination of question types. Smart table/card layout logic for `yes_no_na` questions within a block.
- **Template Management System**: Admin interface for uploading, activating, and deleting Excel-based question and protocol templates, supporting unified multilingual templates. Template preview dialog with metadata and question list.
- **Excel Integration**: XML-based manipulation preserving formatting, handling unicode, and supporting complex cell mapping. Calculations handled by Excel's formulas.
- **Dual PDF Generation System**: LibreOffice for protocol PDFs (Excel-to-PDF) and jsPDF for error list PDFs (with embedded Roboto fonts).
- **Data Persistence**: Form data saved to localStorage and PostgreSQL.
- **Offline Support**: Questions and lift types cached in localStorage and service worker. Completed protocols queued in localStorage and auto-synced on network return. Visual offline status bar.
- **Backup & Restore System**: Full database backup/restore via admin panel, creating downloadable JSON. Admin-only access.
- **Error Documentation**: Allows adding, editing, and deleting protocol errors with image attachments.
- **Digital Signature**: Canvas-based signature capture with printed name functionality.
- **Measurement & Calculation**: Supports 'measurement' and 'calculated' question types with a dedicated engine and automatic error detection.
- **Excel Template-Based Niedervolt System**: Dynamic device loading from Excel templates with custom device creation and FI measurement columns.
- **Deployment**: Configured for Vercel with serverless API, PWA functionality.
- **Authentication & Authorization**: Supabase integration for user authentication with role-based access control (admin, technician, user), including user profiles, session management, multilingual login/registration, protected routes, and API security with JWT token validation and Zod validation. Local DB is authoritative for roles; Supabase metadata only overrides for elevated roles.
- **AI-Powered Help System**: Integrated Smart Help Wizard with contextual suggestions, FAQ (5 languages), interactive AI chat (Groq), and downloadable user manual.
- **Technician Module**: Full repair workflow, role-based routing, assignment management, and error status tracking for technicians. Dashboard shows lift identifier (answers['7']), error counts by status, 5-language selector with flag icons.

## Key Database Notes
- `protocols.user_id` column exists in DB but NOT in `shared/schema.ts` — must use raw SQL (`sql` template literals) for user_id filtering in `storage.ts` and `admin-routes.ts`.
- Protocol identifier shown in UI = `answers['7']` (Otis Lift-azonosító field).

## Known URL Encoding Pattern
- Error IDs may contain forward slashes (e.g. `grounding_OK3/1`). Always use `encodeURIComponent(errorId)` in frontend fetch URLs for technician repair PATCH requests.

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
- **Database ORM**: `drizzle-orm`, `@neondatabase/serverless`
- **Schema Validation**: `zod`
- **File Manipulation**: `adm-zip`, `xml2js`, `simple-excel-js`
- **PDF Generation**: `libreoffice-convert`, `jspdf`
- **Authentication**: `supabase-js`
- **AI Integration**: `openai` (used with Groq API)
- **Utilities**: `nanoid`
