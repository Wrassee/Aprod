# OTIS APROD (Acceptance Protocol Document) Application

## Version: 0.9.9

## Overview
This full-stack TypeScript application digitalizes the OTIS elevator acceptance protocol process. It guides users through a step-by-step questionnaire, enables error documentation with images, generates PDFs, and supports sharing. The system operates in both Hungarian and German with complete multilingual support across all interfaces, aiming to streamline and standardize the acceptance process, reduce manual errors, and improve efficiency for OTIS technicians. The project envisions a future of fully digitized and seamlessly integrated elevator inspection and acceptance procedures within existing OTIS systems.

## User Preferences
Preferred communication style: Simple, everyday language (Hungarian preferred).
Frustrated with Vite complexity - prefers solutions that avoid Vite whenever possible.
Requires immediate user feedback for all actions - no "silent buttons" or unclear states.
Excel writing functionality must remain untouched to prevent corruption.
Prefers free AI APIs (Groq) over paid solutions.

## System Architecture
### Frontend
- **Framework**: React with TypeScript, using Vite.
- **Routing**: Wouter.
- **UI Library**: Shadcn/ui built on Radix UI.
- **Styling**: TailwindCSS with custom OTIS brand colors.
- **State Management**: React hooks and context for local state, with localStorage persistence.
- **Data Fetching**: TanStack Query.
- **Localization**: Complete 5-language support (Hungarian/German/English/French/Italian) using LanguageProvider context and translation objects. All UI components dynamically switch languages based on user preference, with persistence in localStorage.
- **UI/UX Decisions**: Mobile-first, tablet-optimized interface with official OTIS branding. Prioritized input stability, debouncing, and a global Map cache for radio button functionality. Advanced save system with visual feedback.

### Backend
- **Runtime**: Node.js with TypeScript.
- **Framework**: Express.js.
- **Database**: PostgreSQL with Drizzle ORM.
- **File Generation**: Dedicated services for Excel and PDF document creation.
- **API Endpoints**: RESTful API for protocols, templates, and question configurations.
- **AI Integration**: Groq API with llama-3.3-70b-versatile model for interactive help chat.

### Key Features & Design Patterns
- **Multi-language Support**: Hungarian and German localization with dynamic switching, using stable `groupKey` slugs for filtering logic and 5-language coverage for core features.
- **Conditional Question Filtering**: Excel-driven visibility control using stable `groupKey` architecture for language-independent filtering. Supports `conditional_group_key` for hiding/showing question blocks based on yes/no answers, with `defaultIfHidden` for automatic Excel cell population when questions are hidden.
- **Mixed-Type Question Blocks**: Flexible rendering supporting any combination of question types (radio, text, select, measurement, calculated) within a block. Smart table/card layout logic: if ≥3 `yes_no_na` questions exist in a mixed block, they render as a table; 1-2 render as individual cards.
- **Template Management System**: Admin interface for uploading, activating, and deleting Excel-based question and protocol templates, supporting unified multilingual templates. Template download uses authenticated fetch+blob (not window.location.href). Template preview dialog shows metadata and question list for both modern and classic themes.
- **Excel Integration**: XML-based manipulation preserving formatting, handling unicode, and supporting complex cell mapping. Calculations handled by Excel's formulas.
- **Dual PDF Generation System**: LibreOffice for protocol PDFs (Excel-to-PDF conversion) and jsPDF for error list PDFs (with embedded Roboto fonts for Unicode support).
- **Data Persistence**: Form data saved to localStorage and PostgreSQL.
- **Offline Support**: Questions cached in localStorage after first load for offline access. Completed protocols queued in localStorage offline queue (`otis-offline-queue`) and auto-synced when network returns. OfflineStatusBar component shows connection status and pending sync count. Service worker caches `/api/questions` and `/api/lifts/available` responses for offline use. PDF generation happens server-side on sync.
- **Backup & Restore System**: Full database backup/restore via admin panel. Creates downloadable JSON containing all tables (protocols, templates, lift types, profiles, audit logs). Restore with confirmation dialog showing record counts and warnings. Admin-only access.
- **Error Documentation**: Allows adding, editing, and deleting protocol errors with image attachments.
- **Digital Signature**: Canvas-based signature capture with printed name functionality.
- **Measurement & Calculation**: Supports 'measurement' and 'calculated' question types with a dedicated engine and automatic error detection.
- **Excel Template-Based Niedervolt System**: Dynamic device loading from Excel templates with custom device creation and FI measurement columns.
- **Deployment**: Configured for Vercel with serverless API, PWA functionality, and automated deployment scripts.
- **Authentication & Authorization**: Complete Supabase integration for user authentication with active role-based access control, including user profiles, session management, multilingual login/registration, protected routes, and API security with JWT token validation and Zod validation.
- **AI-Powered Help System**: Integrated Smart Help Wizard with 4 tabs:
  - Contextual suggestions based on current page
  - FAQ with 6 categories in 5 languages
  - Interactive AI chat powered by Groq (llama-3.3-70b-versatile)
  - Downloadable user manual in HTML format
- **Modern Calendar Date Picker**: `calendar.tsx` redesigned with dark glassmorphism style (Syne + DM Mono fonts, indigo gradient, blur backdrop). `PageHeader.tsx` uses Radix Popover + react-day-picker with locale-aware `PP` date format for all 5 languages. Date picker only shown on relevant pages (not on lift selector).

## MOD_HYD Hydraulic Protocol — Work In Progress
- **Question JSON files created** (all 5 languages): `public/questions_hydro_de.json`, `questions_hydro_hu.json`, `questions_hydro_en.json`, `questions_hydro_fr.json`, `questions_hydro_it.json`
- **Structure**: 21 groups, ~164 Ja/Nein questions extracted from ABNAHME_HYDRO.DOC (sections 2–13)
- **ID format**: `H_2.1.2`, `H_7.5.3`, etc. — matching document section numbers
- **Next steps**: (1) User uploads PDF AcroForm → extract field names; (2) Create `server/config/hydro-pdf-mapping.ts`; (3) Create `server/services/hydro-pdf-service.ts`; (4) Create `src/pages/hydraulic-protocol.tsx`; (5) Add `/download-hydro-pdf` route; (6) Wire MOD_HYD subtype in App.tsx

## Recent Changes (v0.9.9) — Technician Module COMPLETE

### Technician Module
- **Backend**: `server/routes/technician-routes.ts` — GET /my-assignments, PATCH /assignments/:protocolId/errors/:errorId, GET /technicians, POST /assign/:protocolId
- **DB Schema**: `assigned_technician_id` column added to `protocols` table (`npm run db:push --force`)
- **Auth Middleware**: `requireTechnicianOrAdmin` middleware in `server/middleware/auth.ts`
- **Storage Methods**: `getProtocolsByTechnicianId` + `getTechnicianUsers` added to `server/storage.ts`
- **Technician Dashboard**: `src/pages/technician-dashboard.tsx` — full repair workflow with status management, comment, proof photo upload
- **Role-Based Routing**: App.tsx routes technicians to `technician-dashboard` after login (via `useEffect` watching `role` from `useAuth`)
- **3 Roles**: admin, technician, user — role change dropdown added to user-list.tsx (admin panel)
- **PATCH /api/admin/users/:id/role**: Admin can change user role to technician/admin/user
- **Error Status Badges**: `error-list.tsx` shows repair status (done/in_progress/blocked/pending) with color-coded badges in both Modern and Classic themes
- **Assign Technician UI**: Protocol list (`protocol-list.tsx`) shows technician assignment dropdown for admin — only visible if technicians exist in the system
- **Translations**: `roleTechnician`, `assignTechnician`, `technicianAssigned` + 27 other technician module keys in all 5 languages
- **getAuthHeaders fix**: `getAuthHeaders()` called without params (uses singleton supabase client from `@/lib/supabaseClient`)

## Previous Changes (v0.9.8)
- **Modern Calendar Date Picker**: HTML `<input type="date">` replaced with dark glassmorphism Radix Popover + react-day-picker Calendar in `PageHeader.tsx`. Locale-aware `PP` format, `isValid()` guard, Syne + DM Mono fonts.
- **Lift Selector Date Picker Fix**: Removed `receptionDate`/`onReceptionDateChange` props from all 3 PageHeader instances in `lift-selector.tsx` — date picker no longer appears during lift type/subtype selection.
- **Template Download Auth Fix**: `handleDownload` in `template-management.tsx` now uses `fetch()` + blob URL instead of `window.location.href`, correctly sending the Authorization header. Server no longer returns 401.
- **Template Preview Endpoint**: New `GET /api/admin/templates/:id/preview` endpoint in `admin-routes.ts` returns template metadata. Preview dialog added to both modern and classic themes in `template-management.tsx`. Questions fetched with correct `templateId` query param and active language.
- **yes_no_na Smart Table Layout**: Mixed question blocks with ≥3 `yes_no_na` questions now render those questions in table format (TrueFalseGroup), while remaining questions appear as individual cards. Blocks with 1–2 `yes_no_na` questions remain as individual cards. Logic in `questionnaire.tsx`.
- **Hungarian „N.a." Translation**: `notApplicable` key in `translations.ts` changed from `"Nem alkalmazható"` to `"N.a."` for Hungarian — prevents text overflow in button labels.

### Previous (v0.9.7)
- **Offline Support**: Full offline data persistence — completed protocols queued locally when offline and auto-synced on reconnect
- **Questions Caching**: Questions cached in localStorage and service worker cache after first load, available offline
- **Lift Types Caching**: `/api/lifts/available` responses cached by service worker for offline use
- **OfflineStatusBar**: Visual indicator showing online/offline status with pending sync count, auto-sync on reconnect, manual sync button
- **Service Worker v0.9.7**: Updated to intercept and cache `/api/questions` and `/api/lifts/available` API responses
- **Offline Queue Service**: `OfflineQueue` utility with robust sync logic (stale-safe iteration, in-flight guard, network vs server error distinction)
- **5-Language Offline Translations**: All offline status messages translated (hu/de/en/fr/it)

### Previous (v0.9.6)
- Added AI-powered help system with Groq LLM integration
- Implemented FAQ with 6 categories and 40+ questions in 5 languages
- Smart Help Wizard with 4 tabs: Tips, FAQ, AI Chat, Manual
- Added defaultIfHidden auto-fill logic for conditional questions
- Audit log translations and health diagnostics

## Key File Reference
| File | Purpose |
|------|---------|
| `src/pages/questionnaire.tsx` | Main questionnaire page; block rendering logic (table vs card) |
| `src/components/true-false-group.tsx` | Table-style renderer for yes_no_na / boolean radio blocks |
| `src/components/isolated-question.tsx` | Individual question card renderer |
| `src/components/template-management.tsx` | Admin template upload/download/preview/activate |
| `src/components/PageHeader.tsx` | Header with modern calendar date picker |
| `src/components/ui/calendar.tsx` | Dark glassmorphism calendar component |
| `src/components/offline-status-bar.tsx` | Online/offline status indicator with sync |
| `src/utils/offline-queue.ts` | Offline protocol queue with auto-sync logic |
| `src/lib/translations.ts` | All 5-language translation strings |
| `server/routes/admin-routes.ts` | Admin API: templates, users, audit, backup, PATCH /users/:id/role |
| `server/routes/technician-routes.ts` | Technician API: assignments, repair status updates, assign to protocol |
| `src/pages/technician-dashboard.tsx` | Technician-only dashboard: assigned protocols, error repair workflow |
| `server/routes.ts` | Main API route registration |
| `public/sw.js` | Service worker for offline caching |

## Environment Variables Required
- `GROQ_API_KEY` - For AI chat functionality (free from console.groq.com)
- `SUPABASE_SERVICE_ROLE_KEY` - For Supabase admin operations
- `VITE_SUPABASE_ANON_KEY` - For frontend Supabase access
- `DATABASE_URL` - PostgreSQL connection string

## External Dependencies
### Frontend
- **React Ecosystem**: `react`, `react-dom`
- **UI Components**: `@radix-ui/react-slot`, `lucide-react`, `class-variance-authority`, `tailwind-merge`
- **Styling**: `tailwindcss`
- **Data Fetching**: `@tanstack/react-query`
- **Date Handling**: `date-fns`
- **Routing**: `wouter`
- **Signature Capture**: `react-signature-canvas`
- **Calendar**: `react-day-picker` (Radix Popover + custom dark glassmorphism styling)

### Backend
- **Server Framework**: `express`
- **Database ORM**: `drizzle-orm`, `@neondatabase/serverless` (PostgreSQL driver)
- **Schema Validation**: `zod`
- **File Manipulation**: `adm-zip`, `xml2js`, `simple-excel-js`
- **PDF Generation**: `libreoffice-convert`, `jspdf`
- **Authentication**: `supabase-js`
- **AI Integration**: `openai` (used with Groq API baseURL)
- **Utilities**: `nanoid`
