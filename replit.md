# OTIS APROD (Acceptance Protocol Document) Application

## Overview
This full-stack TypeScript application digitalizes the OTIS elevator acceptance protocol process. It guides users through a step-by-step questionnaire, enables error documentation with images, generates PDFs, and supports sharing. The system operates in both Hungarian and German with **complete multilingual support across all interfaces** (main app, admin panel, and authentication screens), aiming to streamline and standardize the acceptance process, reduce manual errors, and improve efficiency for OTIS technicians. The project envisions a future of fully digitized and seamlessly integrated elevator inspection and acceptance procedures within existing OTIS systems.

## User Preferences
Preferred communication style: Simple, everyday language (Hungarian preferred).
Frustrated with Vite complexity - prefers solutions that avoid Vite whenever possible.
Requires immediate user feedback for all actions - no "silent buttons" or unclear states.
Excel writing functionality must remain untouched to prevent corruption.

## System Architecture
### Frontend
- **Framework**: React with TypeScript, using Vite.
- **Routing**: Wouter.
- **UI Library**: Shadcn/ui built on Radix UI.
- **Styling**: TailwindCSS with custom OTIS brand colors.
- **State Management**: React hooks and context for local state, with localStorage persistence.
- **Data Fetching**: TanStack Query.
- **Localization**: Complete 5-language support (Hungarian/German/English/French/Italian) using LanguageProvider context and translation objects (src/lib/translations.ts). All UI components dynamically switch languages based on user preference.
  - **Language Persistence**: Language preference stored in localStorage ('otis-protocol-language') and loaded immediately on init
  - **Multilingual Coverage**: 180+ translation keys covering main app, admin interface, login/registration, and all UI feedback
  - **SupportedLanguage Type**: Centralized type definition in language-context.tsx: `'hu' | 'de' | 'en' | 'fr' | 'it'`
  - **Lift Selector Translations**: Added frontend translation mapping for EN/FR/IT languages for lift types and subtypes (MOD, BEX, NEU, EGYEDI and their subtypes)
  - **Login Page Navigation**: OTIS logo on login page acts as clickable home button, returning users to language selection screen
  - **Bug Fix (2025-10-26)**: useLanguage hook now initializes with localStorage value immediately instead of defaulting to 'hu' first
  - **Bug Fix (2025-12-16)**: Lift selector card texts now properly translated for EN/FR/IT languages using frontend translation mapping
- **UI/UX Decisions**: Mobile-first, tablet-optimized interface with official OTIS branding. Prioritized input stability, debouncing to prevent cursor jumping, and a global Map cache for radio button functionality. Advanced save system with visual feedback.

### Backend
- **Runtime**: Node.js with TypeScript.
- **Framework**: Express.js.
- **Database**: PostgreSQL with Drizzle ORM.
- **File Generation**: Dedicated services for Excel and PDF document creation.
- **API Endpoints**: RESTful API for protocols, templates, and question configurations.

### Key Features & Design Patterns
- **Multi-language Support**: Hungarian and German localization with dynamic switching, using stable `groupKey` slugs for filtering logic.
- **Conditional Question Filtering**: Excel-driven visibility control using stable `groupKey` architecture for language-independent filtering.
- **Mixed-Type Question Blocks**: Flexible rendering supporting any combination of question types (radio, text, select, measurement, calculated) within a block.
- **Template Management System**: Admin interface for uploading, activating, and deleting Excel-based question and protocol templates, supporting unified multilingual templates.
- **Excel Integration**: XML-based manipulation preserving formatting, handling unicode, and supporting complex cell mapping. Calculations handled by Excel's formulas.
- **Dual PDF Generation System**: 
  - **Protocol PDFs**: LibreOffice conversion for accurate Excel-to-PDF.
  - **Error List PDFs**: jsPDF library with embedded Roboto fonts for Hungarian/German Unicode character support.
  - Environment-aware temp directory handling for cross-platform compatibility.
- **Data Persistence**: Form data saved to localStorage and PostgreSQL.
- **Error Documentation**: Allows adding, editing, and deleting protocol errors with image attachments.
- **Digital Signature**: Canvas-based signature capture with printed name functionality.
- **Measurement & Calculation**: Supports 'measurement' and 'calculated' question types with a dedicated engine and automatic error detection.
- **Excel Template-Based Niedervolt System**: Dynamic device loading from Excel templates with custom device creation and FI measurement columns.
- **Deployment**: Configured for Vercel with serverless API, PWA functionality, and automated deployment scripts.
- **Authentication & Authorization**: Complete Supabase integration for user authentication with active role-based access control
  - **User Profiles**: PostgreSQL profiles table (user_id, name, email, address, google_drive_folder_id, role)
  - **Session Management**: AuthContext with automatic profile loading and session persistence
  - **Login System**: Email/password authentication with registration support, fully multilingual (Hungarian/German)
    - **Multilingual Login/Registration**: 21+ translation keys for login page (titles, labels, error messages, success notifications)
    - **OTIS Logo Navigation**: Logo clickable on login page to return to language selection screen
    - **Dynamic Language Support**: Login interface switches between Hungarian/German based on user's language preference
  - **Protected Routes**: ProtectedRoute wrapper component with auth verification and loading states
  - **Profile Management**: ProfileSettings component for user profile editing integrated into admin interface
  - **API Security**: JWT token validation middleware (`requireAuth`, `requireOwnerOrAdmin` with active admin role checking)
  - **Admin Role Management**: 
    - Active middleware enforcement: Admins can access all user profiles, regular users only their own
    - Admin role assignment via `scripts/set-admin.ts` utility script
    - Visual admin badge (red) displayed in ProfileSettings UI
    - Server-side validation prevents privilege escalation
    - **Multilingual Admin Interface**: All admin UI text uses translation system (no hardcoded strings)
  - **Privilege Escalation Prevention**: Server-side role and user_id field protection with database-backed role verification
  - **Secure API Calls**: All profile operations use Authorization Bearer headers with Zod validation

## Recent Changes (January 13, 2026)
### Version 0.9.5.1 - Error List PDF Fix
6. **Error List PDF Header Data Fix**
   - Fixed incorrect field mapping in error list PDF generation
   - Address now shows full format: PLZ, Stadt, Strasse Hausnummer (fields #3, #4, #5, #6)
   - Inspector name now correctly reads from "Name des Prüfer" (field #1)
   - Lift ID label changed to "Otis Anlage Nummer" (DE) / "Otis telepítési szám" (HU)
   - Updated both backend (error-export.ts, protocol-mapping.ts) and frontend (error-export.tsx, completion.tsx, App.tsx)
   - Consistent display in PDF generation, email attachments, and preview modals (Modern & Classic themes)

### Version 0.9.5.0 - UI Consistency Updates
1. **Classic Theme Home Button**
   - Replaced house icon with OTIS logo as home button across all pages
   - Consistent navigation experience between Modern and Classic themes
   - PageHeader.tsx and admin.tsx updated

2. **Language Selector Indicator**
   - Changed active language indicator from line to dot
   - Uniform styling: blue dot for active, gray dots for inactive
   - Both Modern and Classic themes updated

3. **Email Auto-Fill**
   - Recipient email field auto-fills with logged-in user's email
   - Uses AuthContext profile data

4. **Technical Documentation**
   - Created comprehensive English technical documentation (TECHNICAL_DOCUMENTATION.md)
   - Covers all 23 major sections of the application
   - Updated version to 0.9.5.0 in admin panel

5. **Lift Type Notification Bar Fix**
   - Fixed lift type display in questionnaire notification bar
   - Now shows translated names instead of codes (e.g., "Modernization - Rope Drive" instead of "MOD - MOD_SEIL")
   - Centralized liftTypeTranslations and getTranslatedLiftName in src/lib/translations.ts
   - Supports all 5 languages (HU/DE/EN/FR/IT)

## Previous Changes (December 17, 2025)
### Email Attachment Selection System
1. **Attachment Selection Dialog**
   - Users can now select which documents to attach when sending email
   - Three attachment options: Acceptance Protocol / Grounding Resistance Measurement / Error List
   - Checkbox-based selection with at least one required
   - Full 5-language support (HU/DE/EN/FR/IT) for all dialog text

2. **Backend Email Improvements**
   - Email endpoint now accepts `attachments` parameter with `{ protocol, grounding, errorList }` booleans
   - Dynamic PDF generation based on selected attachments
   - Language-appropriate email body with attachment list in recipient's language
   - HTML-formatted email with OTIS branding

3. **Files Modified**
   - `src/pages/completion.tsx`: Added attachment checkboxes and state management
   - `src/App.tsx`: Updated handleEmailPDF signature to include attachments
   - `server/routes/protocol-mapping.ts`: Dynamic attachment generation based on selection
   - `server/services/email-service.ts`: Full 5-language email templates with attachment listing

## Previous Changes (October 26, 2025)
### Multilingual System Enhancements
1. **Complete Login Page Localization**
   - Added 21+ new translation keys for login/registration interface
   - All error messages, success notifications, and UI text now fully translated
   - Supports both Hungarian and German seamlessly
   
2. **Language Initialization Bug Fix**
   - **Critical Fix**: `useLanguage` hook now loads saved language from localStorage immediately on initialization
   - Previously defaulted to 'hu' before loading preference, causing language flicker
   - Language preference now persists correctly across hard resets
   
3. **Admin Interface Multilingual Support**
   - All hardcoded strings in admin panel replaced with translation keys
   - Template management, user profiles, and settings all fully translated
   - Consistent language experience across entire application
   
4. **Login Page UX Improvement**
   - OTIS logo now clickable as home button
   - Returns user to language selection screen from login page
   - Hover effect (opacity transition) for visual feedback

### Files Modified
- `src/lib/translations.ts`: Added 21+ login page translation keys
- `src/hooks/use-language.ts`: Fixed initialization to load from localStorage immediately
- `src/pages/login.tsx`: Full multilingual implementation with OTIS logo home button
- `src/pages/admin.tsx`: Replaced all hardcoded strings with translation keys
- `src/App.tsx`: Updated Login component to support home button navigation

## External Dependencies
### Frontend
- **React Ecosystem**: `react`, `react-dom`
- **UI Components**: `@radix-ui/react-slot`, `lucide-react`, `class-variance-authority`, `tailwind-merge`
- **Styling**: `tailwindcss`
- **Data Fetching**: `@tanstack/react-query`
- **Date Handling**: `date-fns`
- **Routing**: `wouter`
- **Signature Capture**: `react-signature-canvas`

### Backend
- **Server Framework**: `express`
- **Database ORM**: `drizzle-orm`, `@neondatabase/serverless` (PostgreSQL driver)
- **Schema Validation**: `zod`
- **File Manipulation**: `adm-zip`, `xml2js`, `simple-excel-js`
- **PDF Generation**: `libreoffice-convert`, `jspdf` (with custom Roboto font embedding)
- **Authentication**: `supabase-js`
- **Utilities**: `nanoid`