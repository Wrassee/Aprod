# OTIS APROD (Acceptance Protocol Document) Application

## Version: 0.9.6

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
- **Mixed-Type Question Blocks**: Flexible rendering supporting any combination of question types (radio, text, select, measurement, calculated) within a block.
- **Template Management System**: Admin interface for uploading, activating, and deleting Excel-based question and protocol templates, supporting unified multilingual templates.
- **Excel Integration**: XML-based manipulation preserving formatting, handling unicode, and supporting complex cell mapping. Calculations handled by Excel's formulas.
- **Dual PDF Generation System**: LibreOffice for protocol PDFs (Excel-to-PDF conversion) and jsPDF for error list PDFs (with embedded Roboto fonts for Unicode support).
- **Data Persistence**: Form data saved to localStorage and PostgreSQL.
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

## Recent Changes (v0.9.6)
- Added AI-powered help system with Groq LLM integration (free, no credit card required)
- Implemented comprehensive FAQ with 6 categories and 40+ questions in 5 languages
- Created downloadable/viewable user manual with 14 detailed sections
- Smart Help Wizard now has 4 tabs: Tips, FAQ, AI Chat, Manual
- Switched from Gemini API to Groq API for cost-free AI chat functionality
- Added defaultIfHidden auto-fill logic for conditional questions

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
- **PDF Generation**: `libreoffice-convert`, `jspdf`
- **Authentication**: `supabase-js`
- **AI Integration**: `openai` (used with Groq API baseURL)
- **Utilities**: `nanoid`

## Environment Variables Required
- `GROQ_API_KEY` - For AI chat functionality (free from console.groq.com)
- `SUPABASE_SERVICE_ROLE_KEY` - For Supabase admin operations
- `VITE_SUPABASE_ANON_KEY` - For frontend Supabase access
- `DATABASE_URL` - PostgreSQL connection string
